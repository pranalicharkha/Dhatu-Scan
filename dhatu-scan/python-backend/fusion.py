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
) -> dict:
    """Combine anthropometry, diet, and image into a single 0-100 risk score.

    Returns a dict with:
        fusionScore:  combined 0-100 risk score
        imageScore:   numerical image risk (0-100)
        imageWeight:  applied weight for image signal
        anthroWeight: applied weight for anthropometry
        dietWeight:   applied weight for dietary input

    Weight philosophy (image-led):
    ─────────────────────────────────────────────────────────────────────────
    The trained image model is the most objective signal because it observes
    the child directly.  Metadata (age/height/weight/diet) is self-reported
    and can be wrong.  Therefore image is the PRIMARY driver:

        High quality image  (qualityScore ≥ 80): image=60%, anthro=28%, diet=12%
        Medium quality      (55–79):             image=50%, anthro=32%, diet=18%
        Low quality / none  (<55 or missing):    image=40%, anthro=38%, diet=22%

    When no real image signal is available the score degrades gracefully to
    an anthropometry-led fallback.
    """
    image_signal: float = 0.0
    image_quality: int | None = None

    if image_assessment is not None:
        # Use the ML model's wasting probability as the image signal (0-100)
        image_signal = image_assessment.visibleWastingProbability * 100.0
        image_quality = image_assessment.qualityScore
    elif embedding_hint is not None:
        image_signal = clamp(embedding_hint, 0.0, 100.0)
    else:
        # No image at all — fall back to anthropometry only
        image_signal = wasting_score

    # ── Weight assignment based on image quality ──────────────────────────
    if image_assessment is None and embedding_hint is None:
        # Pure anthropometry fallback — no image available
        image_weight       = 0.0
        anthropometric_weight = 0.70
        dietary_weight     = 0.30
    elif image_quality is not None and image_quality >= 80:
        # High-quality image → trust it most
        image_weight       = 0.60
        anthropometric_weight = 0.28
        dietary_weight     = 0.12
    elif image_quality is not None and image_quality >= 55:
        # Medium-quality image → balanced lean toward image
        image_weight       = 0.50
        anthropometric_weight = 0.32
        dietary_weight     = 0.18
    else:
        # Low quality / embedding hint only → image still leads but less so
        image_weight       = 0.40
        anthropometric_weight = 0.38
        dietary_weight     = 0.22

    fusion = round(
        clamp(
            wasting_score * anthropometric_weight
            + dietary_score * dietary_weight
            + image_signal * image_weight,
            0.0,
            100.0,
        ),
        2,
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
    """Soft WHO advisory nudge — does NOT hard-force a risk category.

    If the WHO z-score indicates severe malnutrition we nudge the fusion
    score upward by at most +15 points at 50 % strength.  This means a
    clear, high-quality image showing a healthy child can still produce a
    low or moderate result even when anthropometry is slightly off, while
    truly severe WHO classifications still add meaningful weight.

    Contrast with the old _apply_who_risk_floor() which forced the score
    to ≥61 (high) or ≥31 (moderate) regardless of image evidence.
    """
    if who_z <= -3.0 or who_status in {
        "severe_wasting", "severe_stunting", "severe_underweight"
    }:
        # Severe — nudge toward 'high' threshold (61) but only partially
        gap = max(0.0, 61.0 - score)
        return round(score + gap * 0.50, 2)

    if who_z <= -2.0 or who_status in {"wasted", "stunted", "underweight"}:
        # Moderate — nudge toward 'moderate' threshold (31) but only partially
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
        f"Combined screening risk is {risk_level}. "
        f"{image_text} "
        f"{clinical_signs_text}"
    )
