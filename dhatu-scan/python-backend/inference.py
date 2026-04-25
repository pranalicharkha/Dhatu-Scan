from __future__ import annotations

from pathlib import Path
from typing import Any

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None

try:
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV3Small
    from tensorflow.keras.applications.mobilenet_v3 import preprocess_input
except Exception:
    tf = None
    MobileNetV3Small = None
    preprocess_input = None

from schemas import ImageAssessment

ROOT = Path(__file__).resolve().parent
TRAINED_MODEL_PATH = ROOT / "training" / "artifacts" / "mobilenetv3_malnutrition.keras"


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _risk_level(score: float) -> str:
    if score <= 0.3:
        return "low"
    if score <= 0.6:
        return "moderate"
    return "high"


def _init_embedder():
    if MobileNetV3Small is None:
        return None
    return MobileNetV3Small(
        include_top=False,
        weights="imagenet",
        input_shape=(224, 224, 3),
        pooling="avg",
    )


_embedder = _init_embedder()


def _load_classifier():
    if tf is None or not TRAINED_MODEL_PATH.exists():
        return None
    try:
        return tf.keras.models.load_model(TRAINED_MODEL_PATH, compile=False)
    except Exception:
        return None


_classifier = _load_classifier()


def extract_embedding(masked_bgr: Any):
    if (
        _embedder is None
        or tf is None
        or preprocess_input is None
        or cv2 is None
        or np is None
        or masked_bgr is None
    ):
        return np.zeros((576,), dtype=np.float32) if np is not None else [0.0] * 576

    rgb = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_AREA)
    batch = np.expand_dims(resized.astype(np.float32), axis=0)
    batch = preprocess_input(batch)
    emb = _embedder(batch, training=False).numpy().reshape(-1)
    return emb.astype(np.float32)


def _prepare_classifier_input(masked_bgr: Any):
    if (
        _classifier is None
        or preprocess_input is None
        or cv2 is None
        or np is None
        or masked_bgr is None
    ):
        return None
    rgb = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_AREA)
    batch = np.expand_dims(resized.astype(np.float32), axis=0)
    return preprocess_input(batch)


def predict_malnutrition_probability(masked_bgr: Any) -> float | None:
    batch = _prepare_classifier_input(masked_bgr)
    if batch is None:
        return None
    try:
        prediction = _classifier.predict(batch, verbose=0)
    except Exception:
        return None
    if np is None:
        return None
    return float(np.asarray(prediction).reshape(-1)[0])


# ─────────────────────────────────────────────────────────────────────────────
# Clinical Sign Detection — OpenCV pipeline
# All thresholds are intentionally generous so that visual signals in real
# photos are captured rather than suppressed.
# ─────────────────────────────────────────────────────────────────────────────

def _detect_muac(gray: Any, h: int, w: int) -> tuple[list[str], float]:
    """Mid-Upper Arm Circumference thinness proxy.
    MUAC <11.5 cm → SAM; <12.5 cm → MAM in 6-59 month children.
    We use upper-arm pixel width as a fraction of image width.
    """
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None:
        return signs, score

    arm_roi = gray[int(h * 0.22):int(h * 0.48), :]
    if arm_roi.size == 0:
        return signs, score

    _, thresh = cv2.threshold(arm_roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    widths = []
    for row in thresh:
        nz = np.nonzero(row)[0]
        if len(nz) > 3:
            widths.append(int(nz[-1]) - int(nz[0]))

    if not widths:
        return signs, score

    arm_ratio = float(np.median(widths)) / w

    if arm_ratio < 0.22:
        signs.append(
            "Severely thin upper arm detected — possible very low MUAC "
            "(mid-upper arm circumference < 11.5 cm), a key marker of severe acute malnutrition (SAM)."
        )
        score = 0.90
    elif arm_ratio < 0.32:
        signs.append(
            "Thin upper arm proportions detected — possible reduced MUAC "
            "indicating moderate acute malnutrition (MAM). Manual MUAC measurement recommended."
        )
        score = 0.65
    elif arm_ratio < 0.40:
        signs.append(
            "Slightly below-average upper arm width — borderline MUAC; "
            "monitor growth closely."
        )
        score = 0.35

    return signs, score


def _detect_edema_swelling(gray: Any, h: int, w: int, hsv: Any) -> tuple[list[str], float]:
    """Bilateral swelling / edema patterns — kwashiorkor hallmark."""
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None:
        return signs, score

    # Abdominal distension
    abd = gray[int(h * 0.28):int(h * 0.72), int(h * 0.18):int(w * 0.82)]
    if abd.size > 0:
        edges = cv2.Canny(abd, 20, 80)
        cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            largest = max(cnts, key=cv2.contourArea)
            area = cv2.contourArea(largest)
            perim = cv2.arcLength(largest, True)
            roi_area = abd.shape[0] * abd.shape[1]
            circ = (4.0 * np.pi * area) / (perim * perim) if perim > 0 else 0.0
            hull_area = cv2.contourArea(cv2.convexHull(largest))
            convex = area / hull_area if hull_area > 0 else 1.0
            area_ratio = area / roi_area if roi_area > 0 else 0.0

            distension = 0.35 * min(circ / 0.6, 1.0) + 0.35 * min(area_ratio / 0.20, 1.0) + 0.30 * convex
            if distension > 0.50:
                signs.append(
                    "Significant abdominal distension detected — a hallmark of kwashiorkor "
                    "(protein-energy malnutrition). Distended belly with thin limbs is a critical indicator."
                )
                score = max(score, 0.85)
            elif distension > 0.35:
                signs.append(
                    "Possible abdominal distension — may indicate edematous malnutrition. "
                    "Clinical examination recommended."
                )
                score = max(score, 0.55)

    # Lower limb bilateral puffiness
    ly0, ly1 = int(h * 0.58), int(h * 0.92)
    puffy = 0
    for limb in [gray[ly0:ly1, 0:int(w * 0.30)], gray[ly0:ly1, int(w * 0.70):w]]:
        if limb.size == 0:
            continue
        var = cv2.Laplacian(limb, cv2.CV_64F).var()
        if var < 150:      # smooth/puffy texture
            puffy += 1
            score = max(score, 0.55 if var < 100 else 0.38)

    if puffy == 2:
        signs.append(
            "Bilateral lower limb puffiness detected — bilateral pitting edema of feet/legs "
            "is the defining sign of kwashiorkor. Urgent nutritional assessment needed."
        )
        score = max(score, 0.80)
    elif puffy == 1:
        signs.append(
            "Possible limb swelling on one side — unilateral edema; "
            "bilateral pitting test and clinical assessment recommended."
        )

    return signs, score


def _detect_muscle_wasting(gray: Any, h: int, w: int) -> tuple[list[str], float]:
    """Marasmus — stick-thin limbs, reduced body volume."""
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None:
        return signs, score

    # Overall body thinness — lower 55% of image
    body = gray[int(h * 0.45):h, :]
    if body.size > 0:
        _, thr = cv2.threshold(body, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        fill = float(np.sum(thr > 0)) / thr.size
        if fill < 0.18:
            signs.append(
                "Severely reduced body mass detected — extreme thinness consistent with marasmus "
                "(severe wasting). Visible skeletal frame with very little soft tissue."
            )
            score = max(score, 0.90)
        elif fill < 0.28:
            signs.append(
                "Significantly reduced body volume — consistent with moderate-to-severe wasting. "
                "Child appears very thin for expected body frame."
            )
            score = max(score, 0.65)

    # Thigh/calf width
    leg = gray[int(h * 0.68):h, int(w * 0.18):int(w * 0.82)]
    if leg.size > 0:
        _, lt = cv2.threshold(leg, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        ws = []
        for row in lt:
            nz = np.nonzero(row)[0]
            if len(nz) > 3:
                ws.append(int(nz[-1]) - int(nz[0]))
        if ws:
            leg_ratio = float(np.median(ws)) / w
            if leg_ratio < 0.20:
                signs.append(
                    "Very thin lower limbs — stick-thin legs are a severe marker of wasting (marasmus). "
                    "Significant thigh and calf muscle loss detected."
                )
                score = max(score, 0.85)
            elif leg_ratio < 0.30:
                signs.append(
                    "Below-normal lower limb width — possible muscle wasting in thighs and calves "
                    "indicating moderate wasting."
                )
                score = max(score, 0.50)

    return signs, score


def _detect_ribs_and_bones(gray: Any, h: int, w: int) -> tuple[list[str], float]:
    """Visible ribs, prominent clavicle/scapula — severe fat depletion."""
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None:
        return signs, score

    chest = gray[int(h * 0.16):int(h * 0.44), int(h * 0.15):int(w * 0.85)]
    if chest.size > 0:
        sobel_h = cv2.Sobel(chest, cv2.CV_64F, 0, 1, ksize=3)
        mean_h = float(np.mean(np.abs(sobel_h)))
        if mean_h > 30:
            signs.append(
                "Prominent horizontal structures in chest — possible visible ribs, a severe sign "
                "of wasting where subcutaneous fat and muscle are depleted."
            )
            score = max(score, 0.80)
        elif mean_h > 20:
            signs.append(
                "Visible chest structure patterns detected — possible rib prominence indicating "
                "significant loss of subcutaneous fat."
            )
            score = max(score, 0.50)

    shoulder = gray[int(h * 0.12):int(h * 0.26), :]
    if shoulder.size > 0:
        sobel_v = cv2.Sobel(shoulder, cv2.CV_64F, 1, 0, ksize=3)
        if float(np.mean(np.abs(sobel_v))) > 28:
            signs.append(
                "Prominent shoulder/clavicle structures — visible collarbone is a sign of "
                "significant fat and muscle depletion."
            )
            score = max(score, 0.60)

    return signs, score


def _detect_skin_changes(gray: Any, lab: Any, h: int, w: int) -> tuple[list[str], float]:
    """Pallor, dermatosis, dryness, jaundice."""
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None or lab is None:
        return signs, score

    l_ch, a_ch, b_ch = cv2.split(lab)
    mask = gray > 25
    if np.sum(mask) < 80:
        return signs, score

    mean_l  = float(np.mean(l_ch[mask]))
    mean_a  = float(np.mean(a_ch[mask]))
    mean_b  = float(np.mean(b_ch[mask]))
    std_a   = float(np.std(a_ch[mask]))
    std_b   = float(np.std(b_ch[mask]))

    # Pallor
    if mean_l > 165 and mean_a < 134:
        signs.append(
            "Skin pallor detected — pale skin is associated with anemia and protein deficiency, "
            "common in malnourished children."
        )
        score = max(score, 0.55)

    # 'Flaky paint' dermatosis (kwashiorkor)
    if std_a > 15 or std_b > 18:
        signs.append(
            "Uneven skin pigmentation detected — patchy discoloration ('flaky paint' dermatosis) "
            "is a classic sign of kwashiorkor."
        )
        score = max(score, 0.65)

    # Yellowish tinge
    if mean_b > 140:
        signs.append(
            "Yellowish skin tinge detected — may indicate jaundice associated with "
            "liver involvement in severe malnutrition."
        )
        score = max(score, 0.50)

    # Dry/rough skin
    skin_roi = gray[int(h * 0.22):int(h * 0.78), int(w * 0.22):int(w * 0.78)]
    if skin_roi.size > 0:
        lap_var = cv2.Laplacian(skin_roi, cv2.CV_64F).var()
        if lap_var > 600:
            signs.append(
                "High skin texture roughness — severely dry or flaky skin indicating "
                "micronutrient deficiency (zinc, vitamin A, niacin)."
            )
            score = max(score, 0.60)
        elif lap_var > 400:
            signs.append(
                "Elevated skin texture roughness — possible dry skin indicating micronutrient deficiency."
            )
            score = max(score, 0.35)

    return signs, score


def _detect_hair(gray: Any, hsv: Any, h: int, w: int) -> tuple[list[str], float]:
    """Thinning, flag sign, depigmentation."""
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None or hsv is None:
        return signs, score

    head = gray[0:int(h * 0.24), int(w * 0.20):int(w * 0.80)]
    head_hsv = hsv[0:int(h * 0.24), int(w * 0.20):int(w * 0.80)]
    if head.size < 80:
        return signs, score

    texture  = cv2.Laplacian(head, cv2.CV_64F).var()
    mean_sat = float(np.mean(head_hsv[:, :, 1]))
    mean_hue = float(np.mean(head_hsv[:, :, 0]))

    if texture < 200 and mean_sat < 50:
        signs.append(
            "Low hair density/texture detected — sparse, thin hair is a sign of protein deficiency. "
            "Hair follicles weaken significantly in malnourished children."
        )
        score = max(score, 0.60)

    if 5 < mean_hue < 28 and mean_sat > 35:
        signs.append(
            "Reddish or light hair discoloration detected — the 'flag sign' (alternating pigmentation "
            "bands) is pathognomonic of kwashiorkor caused by episodic protein deficiency."
        )
        score = max(score, 0.80)

    if mean_sat < 25 and mean_hue > 85:
        signs.append(
            "Possible hair depigmentation — loss of hair colour in children can indicate "
            "severe protein-energy malnutrition."
        )
        score = max(score, 0.55)

    return signs, score


def _detect_facial_signs(gray: Any, h: int, w: int) -> tuple[list[str], float]:
    """Sunken eyes, moon face, periorbital hollowing."""
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None:
        return signs, score

    eye_roi = gray[int(h * 0.06):int(h * 0.30), int(w * 0.12):int(w * 0.88)]
    if eye_roi.size > 0:
        dark_ratio = float(np.sum(eye_roi < 60)) / eye_roi.size
        if dark_ratio > 0.28:
            signs.append(
                "Sunken eye sockets detected — deeply sunken eyes are a sign of severe dehydration "
                "and wasting (significant loss of periorbital fat)."
            )
            score = max(score, 0.75)
        elif dark_ratio > 0.18:
            signs.append(
                "Possible periorbital hollowing — may indicate dehydration or loss of orbital fat "
                "pad associated with wasting."
            )
            score = max(score, 0.40)

    face_roi = gray[int(h * 0.02):int(h * 0.42), int(w * 0.08):int(w * 0.92)]
    if face_roi.size > 0:
        edges = cv2.Canny(face_roi, 25, 75)
        cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            largest = max(cnts, key=cv2.contourArea)
            area = cv2.contourArea(largest)
            perim = cv2.arcLength(largest, True)
            if perim > 0:
                circ = (4.0 * np.pi * area) / (perim * perim)
                if circ > 0.72:
                    signs.append(
                        "'Moon face' detected — rounded facial profile is a sign of facial edema "
                        "in kwashiorkor, caused by fluid accumulation."
                    )
                    score = max(score, 0.68)

    return signs, score


def _overall_thinness_heuristic(gray: Any, h: int, w: int) -> tuple[list[str], float]:
    """Global thinness assessment using full-image body pixel fill ratio."""
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None:
        return signs, score

    _, thr = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    fill = float(np.sum(thr > 0)) / thr.size
    # A very sparse body fill suggests extreme thinness / wasting
    if fill < 0.22:
        signs.append(
            "Overall body appears very thin relative to image frame — consistent with "
            "significant wasting or severe acute malnutrition."
        )
        score = 0.70
    elif fill < 0.30:
        signs.append(
            "Body appears thin relative to image frame — possible moderate wasting. "
            "Anthropometric measurement recommended."
        )
        score = 0.45
    return signs, score


def detect_clinical_signs(masked_bgr: Any) -> tuple[list[str], float]:
    """Run all 8 clinical sign detectors and combine scores.

    Returns (detected_signs, combined_risk_score 0.0–1.0).
    """
    if cv2 is None or np is None or masked_bgr is None:
        return [], 0.0

    h, w = masked_bgr.shape[:2]
    if h < 50 or w < 50:
        return [], 0.0

    gray = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2GRAY)
    hsv  = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2HSV)
    lab  = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2LAB)

    all_signs: list[str] = []
    sub_scores: list[float] = []

    for fn, args in [
        (_detect_muac,               (gray, h, w)),
        (_detect_edema_swelling,     (gray, h, w, hsv)),
        (_detect_muscle_wasting,     (gray, h, w)),
        (_detect_ribs_and_bones,     (gray, h, w)),
        (_detect_skin_changes,       (gray, lab, h, w)),
        (_detect_hair,               (gray, hsv, h, w)),
        (_detect_facial_signs,       (gray, h, w)),
        (_overall_thinness_heuristic,(gray, h, w)),
    ]:
        s, sc = fn(*args)
        all_signs.extend(s)
        if sc > 0:
            sub_scores.append(sc)

    if sub_scores:
        peak = max(sub_scores)
        mean = sum(sub_scores) / len(sub_scores)
        combined = _clamp(0.60 * peak + 0.40 * mean, 0.0, 0.95)
    else:
        combined = 0.0

    return all_signs, combined


def analyze_visible_signs(
    embedding_dim: int,
    quality_score: int,
    face_masked: bool,
    visible_signs: list[str],
    masked_bgr: Any | None = None,
) -> ImageAssessment:
    """Produce a full ImageAssessment from the uploaded image.

    When masked_bgr is provided: runs trained classifier + 8 OpenCV detectors.
    Without it: falls back to heuristic from qualityScore + passed-in signs.
    """
    detected_signs, detected_risk = detect_clinical_signs(masked_bgr)
    all_signs = list(visible_signs) + detected_signs

    model_probability = predict_malnutrition_probability(masked_bgr)

    sign_strength   = min(len(all_signs), 8)
    quality_penalty = (100 - quality_score) / 100.0

    # ── Heuristic fallback when trained model unavailable ─────────────────
    # More aggressive so that detected clinical signs drive the score.
    heuristic = _clamp(
        0.15
        + sign_strength * 0.09       # each sign adds ~9 points
        + detected_risk * 0.45       # OpenCV pipeline is primary
        + quality_penalty * 0.12,
        0.04, 0.97,
    )

    if model_probability is not None:
        # Blend: trained classifier 65% + OpenCV clinical pipeline 35%
        wasting_prob = _clamp(0.65 * model_probability + 0.35 * detected_risk, 0.03, 0.97)
    else:
        # No trained model → rely fully on OpenCV heuristic
        wasting_prob = heuristic

    base_edema = 0.06 + quality_penalty * 0.06
    oedema_prob = _clamp(max(base_edema, detected_risk * 0.75), 0.02, 0.95)

    risk_level = _risk_level(wasting_prob)

    if model_probability is not None and wasting_prob >= 0.55:
        summary = (
            f"Trained image model and clinical sign analysis indicate elevated malnutrition risk "
            f"({len(detected_signs)} visual sign(s) detected)."
        )
    elif detected_signs:
        summary = (
            f"Clinical sign analysis detected {len(detected_signs)} indicator(s) of possible "
            f"malnutrition: {'; '.join(detected_signs[:2])}{'...' if len(detected_signs) > 2 else ''}. "
            "Manual clinical review is strongly recommended."
        )
    elif model_probability is not None:
        summary = "Trained image model did not detect strong visible malnutrition risk."
    else:
        summary = "No strong visible malnutrition signs detected from the uploaded image."

    return ImageAssessment(
        visibleWastingProbability=round(wasting_prob, 3),
        oedemaProbability=round(oedema_prob, 3),
        riskLevel=risk_level,
        visibleSigns=all_signs,
        qualityScore=quality_score,
        modelVersion=(
            f"mobilenetv3+opencv-clinical-{TRAINED_MODEL_PATH.name}"
            if model_probability is not None
            else f"opencv-clinical-pipeline-v2-{embedding_dim}dims"
        ),
        summary=summary,
    )
