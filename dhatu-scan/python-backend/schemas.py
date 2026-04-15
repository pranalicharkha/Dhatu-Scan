from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


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
UploadPhase = Literal["face", "body", "upload"]


class StoredImage(BaseModel):
    contentType: str
    bytes: list[int]


class MaskedImageReference(BaseModel):
    path: str | None = None
    contentType: str | None = None
    dataUrl: str | None = None


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
    qualityScore: int | None = None
    visibleSigns: list[str] = Field(default_factory=list)


class ImageAssessment(BaseModel):
    visibleWastingProbability: float
    oedemaProbability: float
    riskLevel: RiskLevel
    visibleSigns: list[str]
    qualityScore: int
    modelVersion: str
    summary: str


class AssessmentRequest(BaseModel):
    childId: str
    childName: str
    anthropometry: AnthropometryInput
    dietary: DietaryInput
    capture: CaptureMeta
    originalImage: StoredImage | None = None
    maskedImage: MaskedImageReference | StoredImage | None = None


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
    maskedImage: MaskedImageReference | StoredImage | None = None
    imageAssessment: ImageAssessment | None = None


class AssessmentResponse(BaseModel):
    report: Report
    privacyNote: str


class UploadImageResponse(BaseModel):
    success: bool
    message: str
    mode: CaptureMode
    phase: UploadPhase
    maskedImagePath: str | None = None
    embeddingDim: int
    imageAssessment: ImageAssessment | None = None
