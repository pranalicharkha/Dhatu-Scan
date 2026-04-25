from __future__ import annotations

import json
import math
from datetime import datetime, timezone, timedelta
from pathlib import Path
from threading import Lock
from typing import Literal, Any
from uuid import uuid4

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import os

try:
    import openai
except ImportError:
    openai = None

try:
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v3 import (  # type: ignore
        MobileNetV3Small,
        preprocess_input,
    )
except Exception:  # pragma: no cover - tensorflow is optional at import time
    tf = None
    MobileNetV3Small = None
    preprocess_input = None


Gender = Literal["male", "female", "other"]
WaterSourceType = Literal["piped", "borehole", "surface", "unprotected"]
CaptureMode = Literal["live", "upload"]
WHOStatus = Literal[
    "normal",
    "underweight",
    "severe_underweight",
    "stunted",
    "severe_stunting",
    "wasted",
    "severe_wasting",
]
RiskLevel = Literal["low", "moderate", "high"]
TipSeverity = Literal["info", "warning", "critical"]


class StoredImage(BaseModel):
    contentType: str
    bytes: list[int]


class LandmarkVisibility(BaseModel):
    bodyDetected: int
    faceDetected: int
    bodyRequired: int = 33
    faceRequired: int = 468
    fullBodyVisible: bool
    adequateLighting: bool
    centered: bool
    distanceOk: bool
    headVisible: bool
    feetVisible: bool


class GuidanceTip(BaseModel):
    message: str
    severity: TipSeverity


class GuidanceResponse(BaseModel):
    readinessScore: int
    canCapture: bool
    tips: list[GuidanceTip]


class AnthropometryInput(BaseModel):
    ageMonths: int
    gender: Gender
    heightCm: float
    weightKg: float


class DietaryInput(BaseModel):
    dietDiversity: int = Field(ge=0, le=10)
    waterSource: WaterSourceType
    recentDiarrhea: bool
    diarrheaFrequency: int | None = None
    breastfed: bool | None = None
    mealsPerDay: int | None = None


class CaptureMeta(BaseModel):
    mode: CaptureMode
    bodyLandmarksDetected: int
    faceLandmarksDetected: int
    faceMasked: bool
    modelName: str
    modelConfidence: float
    embeddingRiskHint: float | None = None


class AssessmentRequest(BaseModel):
    childId: str
    childName: str
    anthropometry: AnthropometryInput
    dietary: DietaryInput
    capture: CaptureMeta
    originalImage: StoredImage | None = None
    maskedImage: StoredImage | None = None


class ScoreBreakdown(BaseModel):
    whoZScore: float
    whoStatus: WHOStatus
    wastingScore: float
    dietaryScore: float
    fusionScore: float
    riskLevel: RiskLevel


class Report(BaseModel):
    id: str
    childId: str
    childName: str
    createdAt: str
    capture: CaptureMeta
    scores: ScoreBreakdown
    summary: str
    recommendations: list[str]
    maskedImage: StoredImage | None = None


class AssessmentResponse(BaseModel):
    report: Report
    privacyNote: str


class UploadImageResponse(BaseModel):
    success: bool
    message: str
    mode: CaptureMode
    phase: Literal["face", "body", "upload"]
    maskedImagePath: str | None = None
    embeddingDim: int


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class ParentCreate(BaseModel):
    email: str
    password: str
    fullName: str

class ChildCreate(BaseModel):
    childName: str
    dob: str
    gender: Gender

class ChildResponse(BaseModel):
    childId: str
    childName: str
    dob: str
    gender: str

class ExportResponse(BaseModel):
    downloadUrl: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str


TRAINING_DATASET_URL = "https://platform.who.int/nutrition/malnutrition-database/database-search"

def _find_who_tables() -> Path:
    """Search several possible locations for whoGrowthTables.json."""
    candidates = [
        Path(__file__).resolve().parent / "whoGrowthTables.json",
        Path.cwd() / "whoGrowthTables.json",
        Path("/app") / "whoGrowthTables.json",
        Path(__file__).resolve().parent.parent
        / "src" / "frontend" / "src" / "data" / "whoGrowthTables.json",
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(
        f"whoGrowthTables.json not found. Searched: {[str(c) for c in candidates]}"
    )

WHO_TABLES_PATH = _find_who_tables()
with WHO_TABLES_PATH.open("r", encoding="utf-8") as who_tables_file:
    WHO_TABLES = json.load(who_tables_file)


def _round2(value: float) -> float:
    return round(value, 2)


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _to_iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _normalize_gender(gender: Gender) -> str:
    return "female" if gender == "female" else "male"


def _interpolate_row(value: float, rows: list[dict[str, float]], key: str) -> dict[str, float]:
    sorted_rows = sorted(rows, key=lambda row: float(row.get(key, 0.0)))
    if value <= float(sorted_rows[0].get(key, 0.0)):
        return sorted_rows[0]
    if value >= float(sorted_rows[-1].get(key, 0.0)):
        return sorted_rows[-1]

    for idx in range(len(sorted_rows) - 1):
        lower = sorted_rows[idx]
        upper = sorted_rows[idx + 1]
        lower_value = float(lower.get(key, 0.0))
        upper_value = float(upper.get(key, 0.0))
        if lower_value <= value <= upper_value:
            if upper_value == lower_value:
                return lower
            t = (value - lower_value) / (upper_value - lower_value)
            return {
                key: value,
                "l": float(lower["l"]) + t * (float(upper["l"]) - float(lower["l"])),
                "m": float(lower["m"]) + t * (float(upper["m"]) - float(lower["m"])),
                "s": float(lower["s"]) + t * (float(upper["s"]) - float(lower["s"])),
            }
    return sorted_rows[-1]


def _zscore_from_lms(observed: float, row: dict[str, float]) -> float:
    if observed <= 0:
        return 0.0
    l = float(row["l"])
    m = float(row["m"])
    s = float(row["s"])
    if l == 0:
        base_z = math.log(observed / m) / s
    else:
        base_z = ((observed / m) ** l - 1.0) / (l * s)

    if -3.0 <= base_z <= 3.0:
        return base_z

    def measurement_at_z(z: float) -> float:
        if l == 0:
            return m * math.exp(s * z)
        return m * ((1.0 + l * s * z) ** (1.0 / l))

    if base_z < -3.0:
        sd2neg = measurement_at_z(-2.0)
        sd3neg = measurement_at_z(-3.0)
        sd23neg = sd2neg - sd3neg
        if sd23neg <= 0:
            return -3.0
        return -3.0 + ((observed - sd3neg) / sd23neg)

    sd2pos = measurement_at_z(2.0)
    sd3pos = measurement_at_z(3.0)
    sd23pos = sd3pos - sd2pos
    if sd23pos <= 0:
        return 3.0
    return 3.0 + ((observed - sd3pos) / sd23pos)


def _classify_underweight(waz: float) -> WHOStatus:
    if waz < -3.0:
        return "severe_underweight"
    if waz < -2.0:
        return "underweight"
    return "normal"


def _classify_stunting(haz: float) -> WHOStatus:
    if haz < -3.0:
        return "severe_stunting"
    if haz < -2.0:
        return "stunted"
    return "normal"


def _classify_wasting(whz: float) -> WHOStatus:
    if whz < -3.0:
        return "severe_wasting"
    if whz < -2.0:
        return "wasted"
    return "normal"


def _primary_who_status(
    underweight_status: WHOStatus,
    stunting_status: WHOStatus,
    wasting_status: WHOStatus,
) -> WHOStatus:
    severity_order: list[WHOStatus] = [
        "severe_wasting",
        "severe_stunting",
        "severe_underweight",
        "wasted",
        "stunted",
        "underweight",
        "normal",
    ]
    return sorted(
        [underweight_status, stunting_status, wasting_status],
        key=severity_order.index,
    )[0]


def _primary_zscore(status: WHOStatus, waz: float, haz: float, whz: float) -> float:
    if status in {"severe_wasting", "wasted"}:
        return whz
    if status in {"severe_stunting", "stunted"}:
        return haz
    if status in {"severe_underweight", "underweight"}:
        return waz
    return min(waz, haz, whz)


def _who_zscore(a: AnthropometryInput) -> tuple[float, WHOStatus]:
    sex = _normalize_gender(a.gender)
    bmi = a.weightKg / ((a.heightCm / 100.0) ** 2) if a.heightCm > 0 else 0.0

    wfa_ref = _interpolate_row(float(a.ageMonths), WHO_TABLES["wfa"][sex], "ageMonths")
    lhfa_table = WHO_TABLES["lhfa"][sex]["0_24"] if a.ageMonths < 24 else WHO_TABLES["lhfa"][sex]["24_60"]
    bfa_table = WHO_TABLES["bfa"][sex]["0_24"] if a.ageMonths < 24 else WHO_TABLES["bfa"][sex]["24_60"]
    size_table = WHO_TABLES["wfl"][sex] if a.ageMonths < 24 else WHO_TABLES["wfh"][sex]

    haz_ref = _interpolate_row(float(a.ageMonths), lhfa_table, "ageMonths")
    baz_ref = _interpolate_row(float(a.ageMonths), bfa_table, "ageMonths")
    whz_ref = _interpolate_row(float(a.heightCm), size_table, "sizeCm")

    waz = _zscore_from_lms(a.weightKg, wfa_ref)
    haz = _zscore_from_lms(a.heightCm, haz_ref)
    whz = _zscore_from_lms(a.weightKg, whz_ref)
    _ = _zscore_from_lms(bmi, baz_ref)

    underweight_status = _classify_underweight(waz)
    stunting_status = _classify_stunting(haz)
    wasting_status = _classify_wasting(whz)
    status = _primary_who_status(underweight_status, stunting_status, wasting_status)
    return _round2(_primary_zscore(status, waz, haz, whz)), status


def _wasting_score(a: AnthropometryInput) -> float:
    if a.heightCm <= 0 or a.weightKg <= 0:
        return 0.0
    height_m = a.heightCm / 100.0
    bmi = a.weightKg / (height_m * height_m)
    expected_bmi = 17.5 if a.ageMonths < 24 else 16.5 if a.ageMonths < 60 else 15.5
    bmi_dev = (expected_bmi - bmi) / expected_bmi
    hw_ratio = (a.weightKg / a.heightCm) * 100.0
    expected_hw = 11.0 if a.ageMonths < 12 else 13.0 if a.ageMonths < 36 else 15.0
    hw_dev = (expected_hw - hw_ratio) / expected_hw
    return _clamp((bmi_dev * 0.6 + hw_dev * 0.4) * 100.0, 0.0, 100.0)


def _water_score(source: WaterSourceType) -> int:
    return {"piped": 10, "borehole": 7, "surface": 3, "unprotected": 0}[source]


def _dietary_score(d: DietaryInput) -> float:
    diet = float(max(0, min(10, d.dietDiversity)))
    water = float(_water_score(d.waterSource))
    if d.recentDiarrhea:
        freq = 5 if d.diarrheaFrequency is None else max(0, min(10, d.diarrheaFrequency))
        diarrhea = float(10 - freq)
    else:
        diarrhea = 10.0
    protective = (0.4 * diet + 0.3 * water + 0.3 * diarrhea) * 10.0
    return _clamp(100.0 - protective, 0.0, 100.0)


def _risk(score: float) -> RiskLevel:
    if score <= 30:
        return "low"
    if score <= 60:
        return "moderate"
    return "high"


def _clinical_sign_review_items(image_assessment: ImageAssessment | None) -> list[str]:
    if image_assessment is None:
        return [
            "If visible/recognizable, manually review for faltering growth (not gaining weight/height), "
            "extreme fatigue, irritability, swollen abdomen or limbs (edema), brittle hair, dry skin, "
            "and frequent infections.",
        ]

    review_items = [
        "If visible/recognizable, manually review for faltering growth (not gaining weight/height).",
        "If visible/recognizable, manually review for extreme fatigue and irritability.",
        "If visible/recognizable, manually review for swollen abdomen or limbs (edema).",
        "If visible/recognizable, manually review for brittle hair and dry skin.",
        "If visible/recognizable, manually review for frequent infections from clinical history.",
    ]

    if image_assessment.visibleWastingProbability >= 0.55:
        review_items.append(
            "Model flagged elevated visible wasting probability: prioritize clinical confirmation of growth faltering and fatigue."
        )
    if image_assessment.oedemaProbability >= 0.18:
        review_items.append(
            "Model flagged possible edema pattern: verify swelling in abdomen and limbs with physical exam."
        )
    return review_items


def _recommendations(risk: RiskLevel, image_assessment: ImageAssessment | None = None) -> list[str]:
    if risk == "low":
        recs = [
            "Continue regular monthly growth monitoring.",
            "Maintain diverse meals and safe drinking water.",
            "Keep vaccination and deworming schedules updated.",
        ]
        return recs + _clinical_sign_review_items(image_assessment)
    if risk == "moderate":
        recs = [
            "Increase meal diversity with protein-rich foods and micronutrients.",
            "Schedule nutrition follow-up within 2 weeks.",
            "Monitor hydration and prevent recurrent diarrhea.",
        ]
        return recs + _clinical_sign_review_items(image_assessment)
    recs = [
        "Refer child for urgent pediatric nutrition evaluation.",
        "Begin close weekly follow-up until risk decreases.",
        "Use supervised feeding plan and medical screening for infections.",
    ]
    return recs + _clinical_sign_review_items(image_assessment)


def _summary(report: Report) -> str:
    return (
        "Dhatu-Scan Assessment Report\n"
        f"Child: {report.childName} ({report.childId})\n"
        f"Generated at: {report.createdAt}\n"
        f"WHO Z-score: {report.scores.whoZScore} ({report.scores.whoStatus})\n"
        f"Wasting score: {report.scores.wastingScore}/100\n"
        f"Dietary risk score: {report.scores.dietaryScore}/100\n"
        f"Fusion score: {report.scores.fusionScore}/100\n"
        f"Risk level: {report.scores.riskLevel}\n"
        f"Capture mode: {report.capture.mode}\n"
        f"Model: {report.capture.modelName} (confidence {round(report.capture.modelConfidence * 100, 2)}%)"
    )


def _init_embedder():
    if MobileNetV3Small is None:
        return None
    base = MobileNetV3Small(
        include_top=False,
        weights="imagenet",
        input_shape=(224, 224, 3),
        pooling="avg",
    )
    return base


_embedder = _init_embedder()
_face_cascade = cv2.CascadeClassifier(
    str(Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"),
) if cv2 is not None else None
_masked_dir = Path(__file__).resolve().parent / "masked_images"
_masked_dir.mkdir(parents=True, exist_ok=True)


def _mask_face_bgr(image_bgr: Any) -> Any:
    if cv2 is None:
        return image_bgr
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    masked = image_bgr.copy()
    for (x, y, w, h) in faces:
        face_roi = masked[y : y + h, x : x + w]
        if face_roi.size == 0:
            continue
        blurred = cv2.GaussianBlur(face_roi, (55, 55), 30)
        masked[y : y + h, x : x + w] = blurred
    return masked


def _extract_embedding(masked_bgr: np.ndarray) -> np.ndarray:
    if _embedder is None or tf is None or preprocess_input is None:
        return np.zeros((576,), dtype=np.float32)
    rgb = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_AREA)
    batch = np.expand_dims(resized.astype(np.float32), axis=0)
    batch = preprocess_input(batch)
    emb = _embedder(batch, training=False).numpy().reshape(-1)
    return emb.astype(np.float32)


app = FastAPI(title="Dhatu-Scan Python Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "my_super_secret_for_dhatu_scan"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

from database import engine, Base, get_db
from models import Parent, Child, GrowthEntry, Assessment, Streak
from preprocess import (
    apply_face_mask,
    decode_upload_image,
    dependencies_ready as preprocess_dependencies_ready,
    save_masked_image,
)
from inference import analyze_visible_signs, extract_embedding
from fusion import (
    apply_who_risk_nudge,
    build_assessment_summary,
    calculate_fusion_score,
    risk_from_score,
)
from schemas import (
    AssessmentRequest as ApiAssessmentRequest,
    AssessmentResponse as ApiAssessmentResponse,
    GuidanceResponse as ApiGuidanceResponse,
    GuidanceTip as ApiGuidanceTip,
    ImageAssessment,
    LandmarkVisibility as ApiLandmarkVisibility,
    MaskedImageReference,
    Report as ApiReport,
    ScoreBreakdown as ApiScoreBreakdown,
    UploadImageResponse as ApiUploadImageResponse,
)
Base.metadata.create_all(bind=engine)

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(Parent).filter(Parent.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "backend-ok"}


@app.get("/training-source")
def training_source() -> dict[str, str]:
    return {"datasetUrl": TRAINING_DATASET_URL}


@app.post("/upload-image", response_model=ApiUploadImageResponse)
async def upload_image(
    childId: str = Form(...),
    mode: CaptureMode = Form(...),
    phase: Literal["face", "body", "upload"] = Form(...),
    image: UploadFile = File(...),
) -> ApiUploadImageResponse:
    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    if not preprocess_dependencies_ready():
        image_assessment = analyze_visible_signs(
            embedding_dim=576,
            quality_score=65,
            face_masked=False,
            visible_signs=[],
        )
        return ApiUploadImageResponse(
            success=True,
            message="Mock image successfully uploaded",
            mode=mode,
            phase=phase,
            maskedImagePath="/mock/path.jpg",
            embeddingDim=576,
            imageAssessment=image_assessment,
        )

    decoded = decode_upload_image(content)
    if decoded is None:
        raise HTTPException(status_code=400, detail="Invalid image format")

    masked, face_masked = apply_face_mask(decoded, phase=phase)
    embedding = extract_embedding(masked)
    embedding_dim = int(embedding.shape[0]) if hasattr(embedding, "shape") else len(embedding)
    masked_path = save_masked_image(masked, childId, phase, _masked_dir)
    visible_signs: list[str] = []

    quality_score = 90 if phase == "face" and face_masked else 84 if face_masked else 70
    image_assessment = analyze_visible_signs(
        embedding_dim=embedding_dim,
        quality_score=quality_score,
        face_masked=face_masked,
        visible_signs=visible_signs,
        masked_bgr=masked,
    )

    return ApiUploadImageResponse(
        success=True,
        message="Image successfully uploaded and analyzed",
        mode=mode,
        phase=phase,
        maskedImagePath=masked_path,
        embeddingDim=embedding_dim,
        imageAssessment=image_assessment,
    )


@app.post("/guidance", response_model=ApiGuidanceResponse)
def evaluate_guidance(payload: ApiLandmarkVisibility) -> ApiGuidanceResponse:
    body_cov = 1.0 if payload.bodyRequired <= 0 else min(payload.bodyDetected, payload.bodyRequired) / payload.bodyRequired
    face_cov = 1.0 if payload.faceRequired <= 0 else min(payload.faceDetected, payload.faceRequired) / payload.faceRequired

    weighted = (
        body_cov * 0.45
        + face_cov * 0.2
        + (0.1 if payload.fullBodyVisible else 0.0)
        + (0.08 if payload.centered else 0.0)
        + (0.07 if payload.distanceOk else 0.0)
        + (0.06 if payload.adequateLighting else 0.0)
        + (0.04 if payload.headVisible and payload.feetVisible else 0.0)
    )
    score = int(_clamp(weighted * 100.0, 0.0, 100.0))
    tips: list[ApiGuidanceTip] = []
    if body_cov < 0.85:
        tips.append(ApiGuidanceTip(message="Bring the full body into view.", severity="critical"))
    if face_cov < 0.85:
        tips.append(ApiGuidanceTip(message="Keep the face clearly visible.", severity="warning"))
    if not payload.fullBodyVisible:
        tips.append(ApiGuidanceTip(message="Make sure the whole body is inside the frame.", severity="critical"))
    if not payload.headVisible or not payload.feetVisible:
        tips.append(ApiGuidanceTip(message="Keep both head and feet visible.", severity="warning"))
    if not payload.centered:
        tips.append(ApiGuidanceTip(message="Center the child in the frame.", severity="info"))
    if not payload.distanceOk:
        tips.append(ApiGuidanceTip(message="Step back a little for full-body capture.", severity="info"))
    if not payload.adequateLighting:
        tips.append(ApiGuidanceTip(message="Use brighter lighting.", severity="warning"))
    tips = tips[:3]
    if not tips:
        tips.append(ApiGuidanceTip(message="Capture conditions are good. Proceed with scan.", severity="info"))

    can_capture = (
        score >= 80
        and body_cov >= 0.85
        and face_cov >= 0.85
        and payload.fullBodyVisible
        and payload.headVisible
        and payload.feetVisible
    )
    return ApiGuidanceResponse(readinessScore=score, canCapture=can_capture, tips=tips)


@app.post("/auth/register")
def register(parent: ParentCreate, db: Session = Depends(get_db)):
    db_parent = db.query(Parent).filter(Parent.email == parent.email).first()
    if db_parent:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(parent.password)
    new_parent = Parent(email=parent.email, password_hash=hashed_password, full_name=parent.fullName)
    db.add(new_parent)
    db.commit()
    db.refresh(new_parent)
    
    # Initialize a streak
    new_streak = Streak(parent_email=new_parent.email)
    db.add(new_streak)
    db.commit()
    
    return {"message": "User registered successfully"}


@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    parent = db.query(Parent).filter(Parent.email == form_data.username).first()
    if not parent or not verify_password(form_data.password, parent.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": parent.email}, expires_delta=access_token_expires
    )
    
    # Update streak login
    if parent.streak:
        parent.streak.last_login = datetime.now(timezone.utc)
        db.commit()
        
    return {"access_token": access_token, "token_type": "bearer", "fullName": parent.full_name}


class ChildUpdate(BaseModel):
    childName: str | None = None
    dob: str | None = None
    gender: Gender | None = None

@app.get("/children", response_model=list[ChildResponse])
def get_children(current_user: Parent = Depends(get_current_user), db: Session = Depends(get_db)):
    children = db.query(Child).filter(Child.parent_email == current_user.email).all()
    return [ChildResponse(childId=c.child_id, childName=c.child_name, dob=c.dob, gender=c.gender) for c in children]


@app.post("/children", response_model=ChildResponse)
def create_child(child: ChildCreate, current_user: Parent = Depends(get_current_user), db: Session = Depends(get_db)):
    new_child = Child(
        parent_email=current_user.email,
        child_name=child.childName,
        dob=child.dob,
        gender=child.gender
    )
    db.add(new_child)
    db.commit()
    db.refresh(new_child)
    return ChildResponse(childId=new_child.child_id, childName=new_child.child_name, dob=new_child.dob, gender=new_child.gender)


@app.put("/children/{child_id}", response_model=ChildResponse)
def update_child(child_id: str, child_update: ChildUpdate, current_user: Parent = Depends(get_current_user), db: Session = Depends(get_db)):
    child = db.query(Child).filter(Child.child_id == child_id, Child.parent_email == current_user.email).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    if child_update.childName is not None:
        child.child_name = child_update.childName
    if child_update.dob is not None:
        child.dob = child_update.dob
    if child_update.gender is not None:
        child.gender = child_update.gender
    db.commit()
    db.refresh(child)
    return ChildResponse(childId=child.child_id, childName=child.child_name, dob=child.dob, gender=child.gender)


@app.delete("/children/{child_id}")
def delete_child(child_id: str, current_user: Parent = Depends(get_current_user), db: Session = Depends(get_db)):
    child = db.query(Child).filter(Child.child_id == child_id, Child.parent_email == current_user.email).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    db.delete(child)
    db.commit()
    return {"message": "Child deleted successfully"}


@app.post("/assessment", response_model=ApiAssessmentResponse)
def generate_assessment(payload: ApiAssessmentRequest, current_user: Parent = Depends(get_current_user), db: Session = Depends(get_db)) -> ApiAssessmentResponse:
    who_z, who_status = _who_zscore(payload.anthropometry)
    wasting = _round2(_wasting_score(payload.anthropometry))
    dietary = _round2(_dietary_score(payload.dietary))
    image_assessment: ImageAssessment | None = None
    masked_image_ref: MaskedImageReference | None = None

    if payload.maskedImage is not None:
        if isinstance(payload.maskedImage, dict):
            masked_image_ref = MaskedImageReference(**payload.maskedImage)
        elif hasattr(payload.maskedImage, "path") or hasattr(payload.maskedImage, "dataUrl"):
            masked_image_ref = MaskedImageReference.parse_obj(payload.maskedImage)

    # ── Image Assessment Resolution (priority order) ─────────────────────────
    # 1. Use the pre-computed ImageAssessment sent back by the frontend after
    #    /upload-image ran the real ML model on the actual image.  This is the
    #    most accurate signal and must take priority.
    if payload.capture.imageAssessment is not None:
        image_assessment = payload.capture.imageAssessment

    # 2. Fall back to heuristic-only assessment when no pre-computed result is
    #    available (e.g., older frontend versions or live-camera flows without
    #    an explicit upload step).
    elif payload.capture.visibleSigns or payload.capture.qualityScore is not None:
        image_assessment = analyze_visible_signs(
            embedding_dim=576,
            quality_score=payload.capture.qualityScore or 70,
            face_masked=payload.capture.faceMasked,
            visible_signs=payload.capture.visibleSigns,
            masked_bgr=None,  # no image bytes available at this stage
        )

    # ── Fusion: image is the primary driver (40-60% weight) ──────────────────
    fusion_dict = calculate_fusion_score(
        wasting,
        dietary,
        image_assessment,
        payload.capture.embeddingRiskHint,
    )
    # Soft WHO nudge — does NOT hard-override image evidence
    fusion = _round2(apply_who_risk_nudge(fusion_dict["fusionScore"], who_z, who_status))
    risk = risk_from_score(fusion)

    # Save Assessment to DB
    lifestyle_details_str = json.dumps({
        "recentDiarrhea": payload.dietary.recentDiarrhea,
        "mealsPerDay": payload.dietary.mealsPerDay
    })
    
    db_assessment = Assessment(
        child_id=payload.childId,
        water_source=payload.dietary.waterSource,
        dietary_risk_preview=str(dietary),
        lifestyle_details=lifestyle_details_str
    )
    db.add(db_assessment)
    
    # Save GrowthEntry to DB
    mocked_image_url = masked_image_ref.path if masked_image_ref else None
    
    db_growth = GrowthEntry(
        child_id=payload.childId,
        height=payload.anthropometry.heightCm,
        weight=payload.anthropometry.weightKg,
        z_score=who_z,
        who_status=who_status,
        fusion_score=fusion,
        wasting_score=wasting,
        dietary_score=dietary,
        risk_level=risk,
        image_url=mocked_image_url
    )
    db.add(db_growth)
    
    if current_user.streak:
        current_user.streak.total_scans += 1
    
    db.commit()

    report = ApiReport(
        id=f"rpt_{db_growth.id}",
        childId=payload.childId,
        childName=payload.childName,
        createdAt=_to_iso_now(),
        capture=payload.capture,
        scores=ApiScoreBreakdown(
            whoZScore=who_z,
            whoStatus=who_status,
            wastingScore=wasting,
            dietaryScore=dietary,
            imageScore=fusion_dict["imageScore"],
            fusionScore=fusion,
            riskLevel=risk,
            imageWeight=fusion_dict["imageWeight"],
            anthroWeight=fusion_dict["anthroWeight"],
            dietWeight=fusion_dict["dietWeight"],
        ),
        summary=build_assessment_summary(who_status, risk, image_assessment),
        recommendations=_recommendations(risk, image_assessment),
        maskedImage=masked_image_ref,
        imageAssessment=image_assessment,
    )

    return ApiAssessmentResponse(
        report=report,
        privacyNote="Original image is discarded immediately. Only face-masked image metadata is retained when explicitly provided.",
    )


@app.get("/reports", response_model=list[dict[str, Any]])
def list_reports(child_id: str | None = None, current_user: Parent = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(GrowthEntry).join(Child).filter(Child.parent_email == current_user.email)
    if child_id:
        query = query.filter(GrowthEntry.child_id == child_id)
        
    entries = query.all()
    
    results = []
    for entry in entries:
        results.append({
            "id": entry.id,
            "childId": entry.child_id,
            "zScore": entry.z_score,
            "status": entry.who_status,
            "riskLevel": entry.risk_level,
            "date": entry.created_at.isoformat()
        })
    return results


@app.get("/export", response_model=ExportResponse)
def export_data(current_user: Parent = Depends(get_current_user)):
    # Mock generating a CSV/PDF link
    mock_url = f"https://api.dhatu-scan.com/exports/{current_user.email}_data.csv"
    return ExportResponse(downloadUrl=mock_url)


@app.post("/chat", response_model=ChatResponse)
def chat_with_assistant(request: ChatRequest):
    message = request.message.strip()
    lower_message = message.lower()

    if openai:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            try:
                openai.api_key = api_key
                system_prompt = """
You are an intelligent AI assistant integrated into the "Dhatu Scan" web application.

About the system:
Dhatu Scan is an AI-powered platform that scans, analyzes, and provides insights based on user input data (such as images, reports, or health/metal-related data depending on module). The goal is to help users understand results, guide them through the system, and improve decision-making.

Your responsibilities:

* Help users navigate the platform (login, upload, scan, view results)
* Explain scan results in simple and clear language
* Provide meaningful insights and suggestions based on analysis
* Assist users in troubleshooting issues
* Guide users step-by-step when needed

Behavior rules:

* Be friendly, conversational, and helpful
* Keep answers clear and not too long
* Avoid technical jargon unless user is advanced
* If unsure, say "I'm not sure, but I can help you figure it out"
* Ask follow-up questions if user input is unclear

Context-aware responses:

* If user uploads data → explain what the scan means
* If user is confused → simplify explanation
* If user asks "what next?" → suggest logical next steps
* If user is new → guide from beginning (login → upload → scan → results)

Feature explanations:

* Scanning: Explain how the system analyzes input
* Dashboard: Describe insights, graphs, and results
* Reports: Help interpret results clearly
* Alerts/Predictions: Explain risks or findings simply

Troubleshooting:

* Login issues → suggest checking credentials or reset
* Upload errors → guide file format/size
* No results → suggest retry or proper input

Tone:

* Friendly and supportive (like a smart assistant)
* Slightly casual but professional
* Avoid robotic replies

Restrictions:

* Do not give harmful, illegal, or misleading advice
* Do not make false claims
* Stay focused on Dhatu Scan platform

Advanced intelligence:

* Detect user intent (confused, beginner, expert)
* Adapt explanation level accordingly
* Suggest useful features user may not know
* Encourage better usage of the platform

AI Explanation Mode:

* Break down predictions into simple meaning
* Explain confidence level if available
* Avoid complex ML terms unless asked
* Provide actionable suggestions based on results

Example:
User: "I uploaded file but don't understand result"
→ Explain result in simple terms + what it means + what to do next

User: "How to use this website?"
→ Guide step-by-step from login to results

Always aim to make Dhatu Scan easy, clear, and helpful for every user.
"""
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    max_tokens=300,
                    temperature=0.7
                )
                ai_response = response.choices[0].message.content.strip()
                return ChatResponse(response=ai_response)
            except Exception:
                pass

    if "login" in lower_message or "sign in" in lower_message or "password" in lower_message:
        return ChatResponse(response="To log in, use your email and password on the login screen. If you cannot sign in, try resetting your password or checking your credentials.")
    if "upload" in lower_message or "file" in lower_message or "failed" in lower_message or "failing" in lower_message:
        return ChatResponse(response="To upload data, go to the screening page, choose the correct child, and upload a supported image. If it fails, check the file size and format, then try again.")
    if "result" in lower_message or "scan" in lower_message or "understand" in lower_message:
        return ChatResponse(response="After scanning, the dashboard shows the child’s status, risk levels, and suggestions. I can help explain the result if you tell me what you see.")
    if "what next" in lower_message or "next" in lower_message or "should i" in lower_message:
        return ChatResponse(response="If your scan shows a risk or abnormal result, review the recommendations and consider follow-up actions like a nutrition plan or medical checkup.")
    if "dashboard" in lower_message or "reports" in lower_message or "statistics" in lower_message:
        return ChatResponse(response="The dashboard gives insights on growth, nutrition, and risk levels. Use it to compare progress and find the next recommended step.")
    if "help" in lower_message or "how" in lower_message or "what" in lower_message:
        return ChatResponse(response="I’m here to help with Dhatu Scan. Ask me about login, upload steps, results, or what to do next.")

    return ChatResponse(response="I’m not sure, but I can help you figure it out. Tell me a bit more about what you are trying to do.")
