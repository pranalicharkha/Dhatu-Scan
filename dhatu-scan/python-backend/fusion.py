from __future__ import annotations

from typing import Literal

from schemas import ImageAssessment, RiskLevel, WHOStatus


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def calculate_fusion_score(
    wasting_score: float,
    dietary_score: float,
    image_assessment: ImageAssessment | None,
    embedding_hint: float | None,
) -> float:
    image_signal = 0.0
    image_quality = None
    if image_assessment is not None:
        image_signal = image_assessment.visibleWastingProbability * 100.0
        image_quality = image_assessment.qualityScore
    elif embedding_hint is not None:
        image_signal = clamp(embedding_hint, 0.0, 100.0)
    else:
        image_signal = wasting_score

    # Trust image signal less when quality is weak.
    image_weight = 0.25
    if image_quality is not None:
        if image_quality < 55:
            image_weight = 0.15
        elif image_quality >= 80:
            image_weight = 0.3

    anthropometric_weight = 0.6 if image_weight <= 0.2 else 0.52
    dietary_weight = 1.0 - anthropometric_weight - image_weight

    return round(
        clamp(
            wasting_score * anthropometric_weight
            + dietary_score * dietary_weight
            + image_signal * image_weight,
            0.0,
            100.0,
        ),
        2,
    )


def risk_from_score(score: float) -> RiskLevel:
    if score <= 30:
        return "low"
    if score <= 60:
        return "moderate"
    return "high"


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
        f"Combined screening risk is {risk_level}. "
        f"{image_text} "
        f"{clinical_signs_text}"
    )
