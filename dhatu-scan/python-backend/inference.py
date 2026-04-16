from __future__ import annotations

from pathlib import Path
from typing import Any

try:
    import cv2
    import numpy as np
except ImportError:  # pragma: no cover
    cv2 = None
    np = None

try:
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV3Small  # type: ignore
    from tensorflow.keras.applications.mobilenet_v3 import preprocess_input  # type: ignore
except Exception:  # pragma: no cover
    tf = None
    MobileNetV3Small = None
    preprocess_input = None

from schemas import ImageAssessment


ROOT = Path(__file__).resolve().parent
TRAINED_MODEL_PATH = ROOT / "training" / "artifacts" / "mobilenetv3_malnutrition.keras"


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _risk_level(score: float):
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
    except Exception:  # pragma: no cover
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
    except Exception:  # pragma: no cover
        return None

    if np is None:
        return None
    return float(np.asarray(prediction).reshape(-1)[0])


# ── Clinical Sign Detection via OpenCV ─────────────────────────────────────────

def detect_clinical_signs(masked_bgr: Any) -> tuple[list[str], float]:
    """Analyze an image for visible clinical signs of malnutrition.

    Uses OpenCV-based heuristics to detect:
    - Edema / swelling (abdomen distension, puffy limbs)
    - Skin abnormalities (discoloration, dryness, pallor)
    - Hair thinning / texture changes
    - Muscle wasting (thin limb proportions)

    Returns (list_of_detected_signs, edema_confidence 0.0–1.0).
    """
    if cv2 is None or np is None or masked_bgr is None:
        return [], 0.0

    signs: list[str] = []
    edema_score = 0.0

    h, w = masked_bgr.shape[:2]
    if h < 50 or w < 50:
        return [], 0.0

    # Convert to useful color spaces
    hsv = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2GRAY)
    lab = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2LAB)

    # ── 1. Edema / Swelling Detection ──────────────────────────────────────
    # Analyze the abdomen region (middle 40% height, center 60% width)
    abd_y0, abd_y1 = int(h * 0.30), int(h * 0.70)
    abd_x0, abd_x1 = int(w * 0.20), int(w * 0.80)
    abdomen_roi = gray[abd_y0:abd_y1, abd_x0:abd_x1]

    if abdomen_roi.size > 0:
        # Use edge detection to find contour bulging
        edges = cv2.Canny(abdomen_roi, 30, 100)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if contours:
            largest = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest)
            perimeter = cv2.arcLength(largest, True)
            roi_area = abdomen_roi.shape[0] * abdomen_roi.shape[1]

            # Circularity ratio — high value suggests rounded/distended shape
            if perimeter > 0:
                circularity = (4.0 * np.pi * area) / (perimeter * perimeter)
            else:
                circularity = 0.0

            # Convexity defects — large convex hull vs contour area = bulging
            hull = cv2.convexHull(largest)
            hull_area = cv2.contourArea(hull)
            convexity = area / hull_area if hull_area > 0 else 1.0

            # Area ratio — abdomen contour takes up large portion of ROI
            area_ratio = area / roi_area if roi_area > 0 else 0.0

            # Score abdomen distension
            distension_score = (
                0.35 * min(circularity / 0.7, 1.0)
                + 0.35 * min(area_ratio / 0.25, 1.0)
                + 0.30 * convexity
            )

            if distension_score > 0.55:
                signs.append("Possible abdominal distension detected (potential edema/kwashiorkor sign)")
                edema_score = max(edema_score, distension_score * 0.8)

    # Analyze limb regions for puffiness — compare upper vs lower limb width
    # Left limb region (left 25% width, lower 50% height)
    limb_y0, limb_y1 = int(h * 0.55), int(h * 0.90)
    limb_left_roi = gray[limb_y0:limb_y1, 0:int(w * 0.30)]
    limb_right_roi = gray[limb_y0:limb_y1, int(w * 0.70):w]

    for limb_roi, side in [(limb_left_roi, "left"), (limb_right_roi, "right")]:
        if limb_roi.size == 0:
            continue
        # Smooth variance — puffy/swollen tissue has more uniform intensity
        local_var = cv2.Laplacian(limb_roi, cv2.CV_64F).var()
        if local_var < 120:  # low texture variance → smooth/puffy
            edema_score = max(edema_score, 0.35)
            if local_var < 80:
                signs.append(f"Low tissue texture variance in {side} limb region (possible peripheral edema)")
                edema_score = max(edema_score, 0.55)

    # ── 2. Skin Abnormality Detection ──────────────────────────────────────
    # Analyze skin color distribution in LAB space
    l_channel, a_channel, b_channel = cv2.split(lab)

    # Check for pallor (very high L, low a — pale skin)
    body_mask = gray > 30  # exclude background
    if np.sum(body_mask) > 100:
        mean_l = float(np.mean(l_channel[body_mask]))
        mean_a = float(np.mean(a_channel[body_mask]))
        std_a = float(np.std(a_channel[body_mask]))
        std_b = float(np.std(b_channel[body_mask]))

        # Pallor detection — high lightness + low redness
        if mean_l > 175 and mean_a < 132:
            signs.append("Skin pallor detected (possible anemia or nutrient deficiency indicator)")

        # Skin discoloration — high color variance in a* or b* channels
        if std_a > 18 or std_b > 22:
            signs.append("Uneven skin pigmentation detected (possible dermatosis sign)")

        # Yellowish tinge detection — elevated b* channel
        mean_b = float(np.mean(b_channel[body_mask]))
        if mean_b > 145:
            signs.append("Yellowish skin tinge detected (possible jaundice or carotenemia)")

    # Skin dryness via texture analysis — dry skin has higher local contrast
    skin_roi = gray[int(h * 0.25):int(h * 0.75), int(w * 0.25):int(w * 0.75)]
    if skin_roi.size > 0:
        # Laplacian variance measures texture sharpness
        lap_var = cv2.Laplacian(skin_roi, cv2.CV_64F).var()
        if lap_var > 800:
            signs.append("High skin texture roughness detected (possible dry/flaky skin)")

    # ── 3. Hair Analysis (top 20% of image) ────────────────────────────────
    head_roi = gray[0:int(h * 0.20), int(w * 0.25):int(w * 0.75)]
    if head_roi.size > 100:
        head_texture = cv2.Laplacian(head_roi, cv2.CV_64F).var()
        head_hsv = hsv[0:int(h * 0.20), int(w * 0.25):int(w * 0.75)]
        mean_sat = float(np.mean(head_hsv[:, :, 1]))

        # Thin/sparse hair has low texture + low color saturation
        if head_texture < 100 and mean_sat < 40:
            signs.append("Low hair density/texture detected (possible protein deficiency sign)")

        # Reddish/light hair — flag-sign of kwashiorkor
        mean_hue = float(np.mean(head_hsv[:, :, 0]))
        if 5 < mean_hue < 25 and mean_sat > 50:
            signs.append("Reddish hair discoloration detected (possible kwashiorkor flag sign)")

    # ── 4. Muscle Wasting / Thinness Detection ────────────────────────────
    # Compare upper arm region width to body width
    arm_y0, arm_y1 = int(h * 0.25), int(h * 0.45)
    arm_roi = gray[arm_y0:arm_y1, :]
    if arm_roi.size > 0:
        # Threshold to separate body from background
        _, arm_thresh = cv2.threshold(arm_roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        # Find non-zero pixels per row and get median body width
        row_widths = []
        for row in arm_thresh:
            nz = np.nonzero(row)[0]
            if len(nz) > 5:
                row_widths.append(nz[-1] - nz[0])
        if row_widths:
            median_arm_width = float(np.median(row_widths))
            arm_ratio = median_arm_width / w
            if arm_ratio < 0.25:
                signs.append("Thin upper body/arm proportions detected (possible muscle wasting)")
            elif arm_ratio < 0.35:
                signs.append("Below-average upper body width detected (mild wasting indicator)")

    # ── 5. Rib Visibility Detection ────────────────────────────────────────
    chest_roi = gray[int(h * 0.20):int(h * 0.40), int(w * 0.20):int(w * 0.80)]
    if chest_roi.size > 0:
        # Horizontal edge detection to find rib-like patterns
        sobel_h = cv2.Sobel(chest_roi, cv2.CV_64F, 0, 1, ksize=3)
        abs_sobel = np.abs(sobel_h)
        mean_horiz_edge = float(np.mean(abs_sobel))
        if mean_horiz_edge > 35:
            signs.append("Prominent horizontal structures in chest region (possible visible ribs)")

    return signs, _clamp(edema_score, 0.0, 0.95)


def analyze_visible_signs(
    embedding_dim: int,
    quality_score: int,
    face_masked: bool,
    visible_signs: list[str],
    masked_bgr: Any | None = None,
) -> ImageAssessment:
    # Run clinical sign detection on the image
    detected_signs, detected_edema = detect_clinical_signs(masked_bgr)

    # Merge any externally-provided signs with auto-detected ones
    all_signs = list(visible_signs) + detected_signs

    model_probability = predict_malnutrition_probability(masked_bgr)
    sign_strength = min(len(all_signs), 6)
    quality_penalty = (100 - quality_score) / 100.0
    embedding_bonus = 0.05 if embedding_dim >= 576 else 0.0
    masking_penalty = 0.04 if not face_masked else 0.0

    heuristic_probability = _clamp(
        0.18 + sign_strength * 0.12 + quality_penalty * 0.22 + embedding_bonus + masking_penalty,
        0.03,
        0.97,
    )
    wasting_probability = (
        _clamp(model_probability, 0.03, 0.97)
        if model_probability is not None
        else heuristic_probability
    )

    # Use real edema detection score instead of pure heuristic
    base_edema = 0.06 + quality_penalty * 0.08 + (0.05 if not face_masked else 0.0)
    oedema_probability = _clamp(
        max(base_edema, detected_edema),
        0.02,
        0.95,
    )

    risk_level = _risk_level(wasting_probability)
    summary = (
        "Trained image model and visible-sign review indicate elevated malnutrition risk."
        if model_probability is not None and wasting_probability >= 0.6
        else "Visible malnutrition signs detected in the uploaded image."
        if all_signs
        else "Trained image model did not detect strong visible malnutrition risk."
        if model_probability is not None
        else "No strong visible malnutrition signs detected from the uploaded image."
    )
    return ImageAssessment(
        visibleWastingProbability=round(wasting_probability, 3),
        oedemaProbability=round(oedema_probability, 3),
        riskLevel=risk_level,
        visibleSigns=all_signs,
        qualityScore=quality_score,
        modelVersion=(
            f"mobilenetv3-trained-{TRAINED_MODEL_PATH.name}"
            if model_probability is not None
            else f"mobilenetv3-backend-{embedding_dim}"
        ),
        summary=summary,
    )
