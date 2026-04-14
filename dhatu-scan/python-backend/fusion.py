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
    if image_assessment is not None:
        image_signal = image_assessment.visibleWastingProbability * 100.0
    elif embedding_hint is not None:
        image_signal = clamp(embedding_hint, 0.0, 100.0)
    else:
        image_signal = wasting_score

    return round(
        clamp(
            wasting_score * 0.55 + dietary_score * 0.2 + image_signal * 0.25,
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
    return (
        f"WHO growth result indicates {who_text}. "
        f"Combined screening risk is {risk_level}. "
        f"{image_text}"
    )
