from __future__ import annotations

from dataclasses import dataclass
from typing import Any

try:
    import cv2
    import numpy as np
except ImportError:  # pragma: no cover
    cv2 = None
    np = None

try:
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v3 import (  # type: ignore
        MobileNetV3Small,
        preprocess_input,
    )
except Exception:  # pragma: no cover
    tf = None
    MobileNetV3Small = None
    preprocess_input = None

from schemas import ImageAssessment


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


def analyze_visible_signs(
    embedding_dim: int,
    quality_score: int,
    face_masked: bool,
    visible_signs: list[str],
) -> ImageAssessment:
    wasting_probability = _clamp(
        0.25 + (len(visible_signs) * 0.18) + ((100 - quality_score) / 400),
        0.05,
        0.95,
    )
    oedema_probability = _clamp(0.08 + (0.04 if not face_masked else 0.0), 0.02, 0.35)
    risk_level = _risk_level(wasting_probability)
    summary = (
        "Visible malnutrition signs detected in the uploaded image."
        if visible_signs
        else "No strong visible malnutrition signs detected from the uploaded image."
    )
    return ImageAssessment(
        visibleWastingProbability=round(wasting_probability, 3),
        oedemaProbability=round(oedema_probability, 3),
        riskLevel=risk_level,
        visibleSigns=visible_signs,
        qualityScore=quality_score,
        modelVersion=f"mobilenetv3-backend-{embedding_dim}",
        summary=summary,
    )
