from __future__ import annotations

from schemas import ImageAssessment, RiskLevel, WHOStatus


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def calculate_fusion_score(
    wasting_score: float,
    dietary_score: float,
    image_assessment: ImageAssessment | None,
    embedding_hint: float | None,
) -> dict:
    """Combine anthropometry, diet, and image into a structured risk score."""
    image_signal = 0.0
    image_quality: int | None = None
    has_image_data = False

    print(f"[FUSION] Input - wasting: {wasting_score}, dietary: {dietary_score}")
    print(f"[FUSION] image_assessment: {image_assessment}, embedding_hint: {embedding_hint}")

    if image_assessment is not None:
        image_signal = image_assessment.visibleWastingProbability * 100.0
        image_quality = image_assessment.qualityScore
        has_image_data = True
        print(f"[FUSION] Using image_assessment - signal: {image_signal}, quality: {image_quality}")
    elif embedding_hint is not None:
        image_signal = clamp(embedding_hint, 0.0, 100.0)
        has_image_data = True
        print(f"[FUSION] Using embedding_hint - signal: {image_signal}")
    else:
        print("[FUSION] No image data - using metadata only")

    if has_image_data:
        image_weight = 0.70
        anthropometric_weight = 0.20
        dietary_weight = 0.10

        if image_signal >= 60:
            image_weight = 0.80
            anthropometric_weight = 0.15
            dietary_weight = 0.05
            print("[FUSION] High risk from image - increased weight to 80%")

        if image_quality is not None and image_quality < 50:
            image_weight = max(image_weight - 0.10, 0.60)
            anthropometric_weight = min(anthropometric_weight + 0.05, 0.25)
            dietary_weight = min(dietary_weight + 0.05, 0.15)
            print("[FUSION] Poor image quality - adjusted weights")
    else:
        image_weight = 0.0
        anthropometric_weight = 0.70
        dietary_weight = 0.30

    fusion = round(
        clamp(
            image_signal * image_weight
            + wasting_score * anthropometric_weight
            + dietary_score * dietary_weight,
            0.0,
            100.0,
        ),
        2,
    )

    print(
        "[FUSION] Final score: "
        f"{fusion} (image: {image_weight*100}%, "
        f"anthropometry: {anthropometric_weight*100}%, dietary: {dietary_weight*100}%)"
    )

    return {
        "fusionScore": fusion,
        "imageScore": round(clamp(image_signal, 0.0, 100.0), 2),
        "imageWeight": round(image_weight, 2),
        "anthroWeight": round(anthropometric_weight, 2),
        "dietWeight": round(dietary_weight, 2),
    }


def risk_from_score(score: float) -> RiskLevel:
    if score <= 30:
        return "low"
    if score <= 60:
        return "moderate"
    return "high"


def apply_who_risk_nudge(score: float, who_z: float, who_status: WHOStatus) -> float:
    """Soft WHO advisory nudge that does not hard-force a risk category."""
    if who_z <= -3.0 or who_status in {
        "severe_wasting", "severe_stunting", "severe_underweight"
    }:
        gap = max(0.0, 61.0 - score)
        return round(score + gap * 0.50, 2)

    if who_z <= -2.0 or who_status in {"wasted", "stunted", "underweight"}:
        gap = max(0.0, 31.0 - score)
        return round(score + gap * 0.40, 2)

    return score


def build_assessment_summary(
    who_status: WHOStatus,
    risk_level: RiskLevel,
    image_assessment: ImageAssessment | None,
) -> str:
    who_text = who_status.replace("_", " ")
    image_text = (
        image_assessment.summary
        if image_assessment is not None
        else "No backend image assessment was attached."
    )
    clinical_signs_text = (
        "If visible and recognizable in capture, results should be reviewed for: "
        "faltering growth (not gaining weight/height), extreme fatigue, irritability, "
        "swollen abdomen or limbs (edema), brittle hair, dry skin, and frequent infections."
    )
    return (
        f"WHO growth result indicates {who_text}. "
        f"Combined screening risk is {risk_level}, with masked-image analysis treated as the primary signal. "
        f"{image_text} "
        f"{clinical_signs_text}"
    )
