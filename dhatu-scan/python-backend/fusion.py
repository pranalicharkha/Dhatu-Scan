from __future__ import annotations

from schemas import ImageAssessment, RiskLevel, WHOStatus


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def calculate_fusion_score(
    wasting_score: float,
    dietary_score: float,
    image_assessment: "ImageAssessment | None",
    embedding_hint: float | None,
) -> dict:
    """Combine image analysis (70%) with anthropometry (30%) for final risk.

    Returns a dict with:
        fusionScore:  combined 0-100 risk score
        imageScore:   numerical image risk (0-100)
        anthroScore:  anthropometry component (0-100)
        featureBreakdown: dict of individual feature scores (0-1)

    Scoring formula:
    ─────────────────────────────────────────────────────────────────────────
    Image composite (already weighted by inference.py):
        image_composite = 0.30*ribs + 0.25*limbs + 0.20*eyes
                        + 0.15*fat_loss + 0.10*edema
                        + bonus(skin, thinness)

    Final score:
        fusion = 0.70 * image_composite_100 + 0.30 * anthro_score
    ─────────────────────────────────────────────────────────────────────────
    """
    # Anthropometry component: blend wasting + dietary
    anthro_score = 0.70 * wasting_score + 0.30 * dietary_score

    feature_breakdown = {}

    if image_assessment is not None:
        # The visibleWastingProbability already incorporates the weighted
        # feature composite from inference.py
        image_score_100 = image_assessment.visibleWastingProbability * 100.0

        # Extract feature breakdown for transparency
        fs = image_assessment.featureScores
        feature_breakdown = {
            "ribs": fs.ribs,
            "limbs": fs.limbs,
            "eyes": fs.eyes,
            "fat_loss": fs.fat_loss,
            "edema": fs.edema,
            "skin": fs.skin,
            "thinness": fs.thinness,
        }
    elif embedding_hint is not None:
        image_score_100 = clamp(embedding_hint, 0.0, 100.0)
    else:
        # No image at all — fall back to pure anthropometry
        image_score_100 = 0.0
        anthro_score = wasting_score  # use full wasting when no image

    # ── Final fusion: 70% image + 30% anthropometry ───────────────────────
    if image_assessment is not None or embedding_hint is not None:
        fusion = 0.70 * image_score_100 + 0.30 * anthro_score
        image_weight = 0.70
        anthropometric_weight = 0.21
        dietary_weight = 0.09
    else:
        # No image available — 100% anthropometry fallback
        fusion = anthro_score
        image_weight = 0.0
        anthropometric_weight = 1.0
        dietary_weight = 0.0

    fusion = round(clamp(fusion, 0.0, 100.0), 2)

    return {
        "fusionScore": fusion,
        "imageScore": round(clamp(image_score_100, 0.0, 100.0), 2),
        "anthroScore": round(clamp(anthro_score, 0.0, 100.0), 2),
        "imageWeight": round(image_weight, 2),
        "anthroWeight": round(anthropometric_weight, 2),
        "dietWeight": round(dietary_weight, 2),
        "featureBreakdown": feature_breakdown,
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
