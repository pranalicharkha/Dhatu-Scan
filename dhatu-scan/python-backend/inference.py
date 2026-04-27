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


def _extract_primary_mask(region: Any) -> Any | None:
    if cv2 is None or np is None or region is None or region.size == 0:
        return None

    blurred = cv2.GaussianBlur(region, (5, 5), 0)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    candidates: list[tuple[float, Any]] = []

    for threshold_mode in (cv2.THRESH_BINARY, cv2.THRESH_BINARY_INV):
        _, thresh = cv2.threshold(blurred, 0, 255, threshold_mode + cv2.THRESH_OTSU)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel, iterations=1)
        cnts, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not cnts:
            continue

        largest = max(cnts, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        area_ratio = area / float(region.shape[0] * region.shape[1])
        if area_ratio < 0.03:
            continue

        x, y, box_w, box_h = cv2.boundingRect(largest)
        center_score = 1.0 - min(abs(((x + box_w / 2.0) / region.shape[1]) - 0.5), 0.5) * 2.0
        height_score = min(box_h / float(region.shape[0]), 1.0)
        candidate_score = min(area_ratio, 0.8) + center_score * 0.35 + height_score * 0.15

        mask = np.zeros_like(region, dtype=np.uint8)
        cv2.drawContours(mask, [largest], -1, 255, thickness=cv2.FILLED)
        candidates.append((candidate_score, mask))

    if not candidates:
        return None

    return max(candidates, key=lambda item: item[0])[1]


def _median_mask_width(mask: Any) -> float:
    if np is None or mask is None or mask.size == 0:
        return 0.0

    widths = []
    for row in mask:
        nz = np.flatnonzero(row > 0)
        if len(nz) >= 4:
            widths.append(float(nz[-1] - nz[0] + 1))
    return float(np.median(widths)) if widths else 0.0


def _band_mask_width(mask: Any, start: float, end: float) -> float:
    if mask is None or mask.size == 0:
        return 0.0

    y0 = max(0, min(mask.shape[0], int(mask.shape[0] * start)))
    y1 = max(y0 + 1, min(mask.shape[0], int(mask.shape[0] * end)))
    if y1 <= y0:
        return 0.0

    return _median_mask_width(mask[y0:y1, :])


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
    """Bilateral swelling / edema patterns - kwashiorkor hallmark."""
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None:
        return signs, score

    # Central torso and stomach analysis
    torso = gray[int(h * 0.18):int(h * 0.82), int(w * 0.16):int(w * 0.84)]
    torso_mask = _extract_primary_mask(torso)
    if torso_mask is not None:
        upper_width = _band_mask_width(torso_mask, 0.14, 0.30)
        stomach_width = _band_mask_width(torso_mask, 0.40, 0.62)
        lower_width = _band_mask_width(torso_mask, 0.64, 0.84)
        full_width = _median_mask_width(torso_mask)

        if upper_width > 0 and stomach_width > 0:
            belly_to_upper = stomach_width / upper_width
            lower_to_upper = lower_width / upper_width if lower_width > 0 else 0.0
            contour = max(
                cv2.findContours(torso_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0],
                key=cv2.contourArea,
                default=None,
            )
            convexity = 0.0
            area_ratio = 0.0
            if contour is not None:
                area = cv2.contourArea(contour)
                hull_area = cv2.contourArea(cv2.convexHull(contour))
                convexity = area / hull_area if hull_area > 0 else 0.0
                area_ratio = area / float(torso_mask.shape[0] * torso_mask.shape[1])

            stomach_distension = (
                0.40 * _clamp((belly_to_upper - 1.02) / 0.28, 0.0, 1.0)
                + 0.25 * _clamp((lower_to_upper - 0.98) / 0.25, 0.0, 1.0)
                + 0.20 * _clamp((full_width / max(torso_mask.shape[1], 1) - 0.42) / 0.24, 0.0, 1.0)
                + 0.15 * _clamp((convexity - 0.80) / 0.18, 0.0, 1.0)
            )

            if stomach_distension > 0.62 or (belly_to_upper > 1.18 and area_ratio > 0.20):
                signs.append(
                    "Swollen or distended stomach detected - central abdominal enlargement is consistent "
                    "with edematous malnutrition or kwashiorkor."
                )
                score = max(score, 0.88)
            elif stomach_distension > 0.42 or belly_to_upper > 1.10:
                signs.append(
                    "Possible abdominal swelling detected - stomach appears more distended than the upper torso, "
                    "which can suggest edema."
                )
                score = max(score, 0.62)

    # Lower leg, ankle, and foot puffiness
    ly0, ly1 = int(h * 0.56), int(h * 0.98)
    limb_regions = [
        gray[ly0:ly1, 0:int(w * 0.34)],
        gray[ly0:ly1, int(w * 0.66):w],
    ]
    limb_scores: list[float] = []

    for limb in limb_regions:
        if limb.size == 0:
            continue

        limb_mask = _extract_primary_mask(limb)
        if limb_mask is None:
            continue

        upper_leg_width = _band_mask_width(limb_mask, 0.08, 0.36)
        ankle_width = _band_mask_width(limb_mask, 0.54, 0.78)
        foot_width = _band_mask_width(limb_mask, 0.80, 0.98)
        lap_var = cv2.Laplacian(limb, cv2.CV_64F).var()

        if upper_leg_width <= 0:
            continue

        distal_ratio = max(ankle_width, foot_width) / upper_leg_width
        ankle_ratio = ankle_width / upper_leg_width if ankle_width > 0 else 0.0
        foot_ratio = foot_width / upper_leg_width if foot_width > 0 else 0.0
        smoothness = _clamp((180.0 - float(lap_var)) / 140.0, 0.0, 1.0)
        limb_score = (
            0.50 * _clamp((distal_ratio - 0.72) / 0.36, 0.0, 1.0)
            + 0.25 * _clamp((ankle_ratio - 0.68) / 0.28, 0.0, 1.0)
            + 0.15 * _clamp((foot_ratio - 0.78) / 0.30, 0.0, 1.0)
            + 0.10 * smoothness
        )
        limb_scores.append(limb_score)

    if len(limb_scores) == 2:
        bilateral_score = min(limb_scores)
        symmetry_bonus = 1.0 - min(abs(limb_scores[0] - limb_scores[1]), 1.0)
        bilateral_score = _clamp(bilateral_score * 0.80 + symmetry_bonus * 0.20, 0.0, 1.0)

        if bilateral_score > 0.62:
            signs.append(
                "Bilateral lower-leg or foot puffiness detected - ankle and foot width remain enlarged on both "
                "sides, which is strongly suggestive of edema."
            )
            score = max(score, 0.84)
        elif bilateral_score > 0.42:
            signs.append(
                "Possible bilateral ankle or foot swelling detected - distal legs do not taper normally, "
                "which may indicate edema."
            )
            score = max(score, 0.60)
    elif len(limb_scores) == 1 and limb_scores[0] > 0.55:
        signs.append(
            "Possible swelling detected in one lower limb - confirm whether both feet or ankles are enlarged."
        )
        score = max(score, 0.45)

    if score >= 0.55 and hsv is not None:
        sat_roi = hsv[int(h * 0.20):int(h * 0.86), int(w * 0.16):int(w * 0.84), 1]
        if sat_roi.size > 0:
            mean_sat = float(np.mean(sat_roi))
            if mean_sat < 42:
                score = min(0.95, score + 0.03)

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
    """Enhanced detection of visible ribs, prominent clavicle/scapula — severe fat depletion."""
    signs: list[str] = []
    score = 0.0
    if cv2 is None or np is None or gray is None:
        return signs, score

    # Enhanced chest region analysis with multiple zones for children
    chest_zones = [
        (int(h * 0.12), int(h * 0.35), int(w * 0.10), int(w * 0.90)),  # Upper chest
        (int(h * 0.25), int(h * 0.48), int(w * 0.15), int(w * 0.85)),  # Mid chest  
        (int(h * 0.38), int(h * 0.55), int(w * 0.20), int(w * 0.80)),  # Lower chest
    ]
    
    rib_indicators = 0
    total_rib_score = 0.0
    
    for y1, y2, x1, x2 in chest_zones:
        chest_zone = gray[y1:y2, x1:x2]
        if chest_zone.size == 0:
            continue
            
        # Multi-scale edge detection for different rib patterns
        rib_score = _analyze_rib_patterns(chest_zone)
        total_rib_score += rib_score
        
        if rib_score > 0.3:
            rib_indicators += 1
            
    # Adaptive scoring based on number of zones with rib indicators
    if rib_indicators >= 3:
        signs.append(
            "Prominent horizontal rib structures visible across multiple chest zones — clear indication "
            "of severe subcutaneous fat and muscle depletion in child."
        )
        score = max(score, 0.85)
    elif rib_indicators >= 2:
        signs.append(
            "Visible rib patterns in chest regions — significant fat loss indicating moderate "
            "to severe malnutrition in child."
        )
        score = max(score, 0.65)
    elif rib_indicators >= 1:
        signs.append(
            "Some chest structure patterns detected — possible early rib prominence indicating "
            "beginning fat loss in child."
        )
        score = max(score, 0.40)
    
    # Enhanced shoulder/clavicle detection
    shoulder_zones = [
        (int(h * 0.08), int(h * 0.22), 0, w),  # Upper shoulder
        (int(h * 0.15), int(h * 0.30), 0, w),  # Mid shoulder
    ]
    
    clavicle_indicators = 0
    for y1, y2, x1, x2 in shoulder_zones:
        shoulder_zone = gray[y1:y2, x1:x2]
        if shoulder_zone.size == 0:
            continue
            
        clavicle_score = _analyze_clavicle_patterns(shoulder_zone)
        if clavicle_score > 0.25:
            clavicle_indicators += 1
            
    if clavicle_indicators >= 2:
        signs.append(
            "Prominent clavicle/shoulder bones visible — significant fat and muscle depletion "
            "in upper body of child."
        )
        score = max(score, 0.70)
    elif clavicle_indicators >= 1:
        signs.append(
            "Some shoulder bone prominence detected — moderate fat loss in child."
        )
        score = max(score, 0.45)

    return signs, score


def _analyze_rib_patterns(chest_region: Any) -> float:
    """Analyze rib patterns using multiple detection methods."""
    if chest_region.size == 0:
        return 0.0
        
    score = 0.0
    
    # 1. Horizontal edge detection (primary method)
    sobel_h = cv2.Sobel(chest_region, cv2.CV_64F, 0, 1, ksize=3)
    h_edges = np.abs(sobel_h)
    mean_h = float(np.mean(h_edges))
    
    # Adaptive threshold based on image brightness
    _, bright_thresh = cv2.threshold(chest_region, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive_threshold = max(15, min(35, bright_thresh * 0.15))
    
    if mean_h > adaptive_threshold * 1.5:
        score += 0.6
    elif mean_h > adaptive_threshold:
        score += 0.3
    
    # 2. Texture analysis for rib patterns
    try:
        # Local Binary Pattern for rib texture
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 1))
        texture = cv2.morphologyEx(chest_region, cv2.MORPH_HITMISS, kernel)
        texture_score = float(np.mean(texture)) / 255.0
        score += texture_score * 0.3
    except:
        pass
    
    # 3. Multi-scale line detection for rib spacing
    try:
        lines = cv2.HoughLinesP(h_edges.astype(np.uint8), 1, np.pi/180, 
                              threshold=int(chest_region.shape[0] * 0.1), 
                              minLineLength=chest_region.shape[1] * 0.2,
                              maxLineGap=chest_region.shape[1] * 0.05)
        if lines is not None and len(lines) > 0:
            # Count horizontal-ish lines (ribs)
            horizontal_lines = sum(1 for line in lines 
                                 if abs(line[0][1] - line[0][3]) < chest_region.shape[0] * 0.1)
            line_score = min(1.0, horizontal_lines / 5.0)  # Normalize to 0-1
            score += line_score * 0.2
    except:
        pass
    
    return min(1.0, score)


def _analyze_clavicle_patterns(shoulder_region: Any) -> float:
    """Analyze clavicle/shoulder bone patterns."""
    if shoulder_region.size == 0:
        return 0.0
        
    score = 0.0
    
    # Vertical edge detection for clavicle
    sobel_v = cv2.Sobel(shoulder_region, cv2.CV_64F, 1, 0, ksize=3)
    v_edges = np.abs(sobel_v)
    mean_v = float(np.mean(v_edges))
    
    # Adaptive threshold
    _, bright_thresh = cv2.threshold(shoulder_region, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive_threshold = max(12, min(30, bright_thresh * 0.12))
    
    if mean_v > adaptive_threshold * 1.4:
        score += 0.7
    elif mean_v > adaptive_threshold:
        score += 0.4
    
    # Check for V-shaped clavicle pattern
    try:
        # Look for diagonal lines that form clavicle shape
        lines = cv2.HoughLinesP(v_edges.astype(np.uint8), 1, np.pi/4, 
                              threshold=int(shoulder_region.shape[0] * 0.08), 
                              minLineLength=shoulder_region.shape[1] * 0.15,
                              maxLineGap=shoulder_region.shape[1] * 0.03)
        if lines is not None and len(lines) >= 2:
            score += 0.3
    except:
        pass
    
    return min(1.0, score)


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


def detect_clinical_signs(masked_bgr: Any) -> tuple[list[str], float, dict[str, float]]:
    """Run all 8 clinical sign detectors and combine scores.

    Returns (detected_signs, combined_risk_score 0.0–1.0, feature_scores_dict).
    The feature_scores_dict maps each visual indicator to its 0.0–1.0 score:
        ribs, limbs, eyes, fat_loss, edema, skin, thinness
    """
    empty_features = {
        "ribs": 0.0, "limbs": 0.0, "eyes": 0.0,
        "fat_loss": 0.0, "edema": 0.0, "skin": 0.0, "thinness": 0.0,
    }
    if cv2 is None or np is None or masked_bgr is None:
        return [], 0.0, empty_features

    h, w = masked_bgr.shape[:2]
    if h < 50 or w < 50:
        return [], 0.0, empty_features

    gray = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2GRAY)
    hsv  = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2HSV)
    lab  = cv2.cvtColor(masked_bgr, cv2.COLOR_BGR2LAB)

    all_signs: list[str] = []
    sub_scores: list[float] = []

    # Run each detector and capture individual scores
    muac_signs, muac_sc = _detect_muac(gray, h, w)
    edema_signs, edema_sc = _detect_edema_swelling(gray, h, w, hsv)
    wasting_signs, wasting_sc = _detect_muscle_wasting(gray, h, w)
    ribs_signs, ribs_sc = _detect_ribs_and_bones(gray, h, w)
    skin_signs, skin_sc = _detect_skin_changes(gray, lab, h, w)
    hair_signs, hair_sc = _detect_hair(gray, hsv, h, w)
    face_signs, face_sc = _detect_facial_signs(gray, h, w)
    thin_signs, thin_sc = _overall_thinness_heuristic(gray, h, w)

    # Collect all signs
    for s_list in [muac_signs, edema_signs, wasting_signs, ribs_signs,
                   skin_signs, hair_signs, face_signs, thin_signs]:
        all_signs.extend(s_list)

    # Collect all non-zero sub-scores for combined calculation
    for sc in [muac_sc, edema_sc, wasting_sc, ribs_sc, skin_sc, hair_sc, face_sc, thin_sc]:
        if sc > 0:
            sub_scores.append(sc)

    if sub_scores:
        peak = max(sub_scores)
        mean = sum(sub_scores) / len(sub_scores)
        combined = _clamp(0.60 * peak + 0.40 * mean, 0.0, 0.95)
    else:
        combined = 0.0

    # Map detector outputs to the 7 feature categories
    feature_scores = {
        "ribs": round(ribs_sc, 3),
        "limbs": round(max(muac_sc, wasting_sc), 3),  # arm + leg thinness
        "eyes": round(face_sc, 3),                      # sunken eyes / facial signs
        "fat_loss": round(max(hair_sc, face_sc * 0.5), 3),  # hair + facial fat
        "edema": round(edema_sc, 3),
        "skin": round(skin_sc, 3),
        "thinness": round(thin_sc, 3),
    }

    return all_signs, combined, feature_scores


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

    The image composite score is built from weighted feature scores:
        image_composite = 0.30 * ribs + 0.25 * limbs + 0.20 * eyes
                        + 0.15 * fat_loss + 0.10 * edema
    """
    from schemas import FeatureScores

    detected_signs, detected_risk, feat = detect_clinical_signs(masked_bgr)
    all_signs = list(visible_signs) + detected_signs

    model_probability = predict_malnutrition_probability(masked_bgr)

    sign_strength   = min(len(all_signs), 8)
    quality_penalty = (100 - quality_score) / 100.0

    # ── Weighted image composite from individual features ─────────────────
    image_composite = (
        0.30 * feat["ribs"]
        + 0.25 * feat["limbs"]
        + 0.20 * feat["eyes"]
        + 0.15 * feat["fat_loss"]
        + 0.10 * feat["edema"]
    )
    # Boost with skin + thinness as bonus signals (up to +0.15)
    bonus = 0.08 * feat["skin"] + 0.07 * feat["thinness"]
    image_composite = _clamp(image_composite + bonus, 0.0, 1.0)

    # ── Heuristic fallback when trained model unavailable ─────────────────
    heuristic = _clamp(
        0.15
        + sign_strength * 0.09
        + image_composite * 0.50       # feature-weighted composite is primary
        + detected_risk * 0.20
        + quality_penalty * 0.08,
        0.04, 0.97,
    )

    if model_probability is not None:
        # Blend: trained classifier 50% + feature-weighted composite 50%
        wasting_prob = _clamp(0.50 * model_probability + 0.50 * image_composite, 0.03, 0.97)
        # If features strongly indicate risk but model doesn't, trust features
        if image_composite >= 0.5 and model_probability < 0.3:
            wasting_prob = _clamp(image_composite, 0.03, 0.97)
    else:
        wasting_prob = heuristic

    # Ensure wasting_prob is at least as high as the feature composite
    wasting_prob = max(wasting_prob, image_composite)

    base_edema = 0.06 + quality_penalty * 0.06
    oedema_prob = _clamp(max(base_edema, feat["edema"], detected_risk * 0.75), 0.02, 0.95)

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
        featureScores=FeatureScores(**feat),
    )
