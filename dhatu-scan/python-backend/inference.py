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


def analyze_visible_signs(
    embedding_dim: int,
    quality_score: int,
    face_masked: bool,
    visible_signs: list[str],
    masked_bgr: Any | None = None,
) -> ImageAssessment:
    model_probability = predict_malnutrition_probability(masked_bgr)
    sign_strength = min(len(visible_signs), 6)
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
    oedema_probability = _clamp(
        0.06 + quality_penalty * 0.08 + (0.05 if not face_masked else 0.0),
        0.02,
        0.4,
    )
    risk_level = _risk_level(wasting_probability)
    summary = (
        "Trained image model and visible-sign review indicate elevated malnutrition risk."
        if model_probability is not None and wasting_probability >= 0.6
        else "Visible malnutrition signs detected in the uploaded image."
        if visible_signs
        else "Trained image model did not detect strong visible malnutrition risk."
        if model_probability is not None
        else "No strong visible malnutrition signs detected from the uploaded image."
    )
    return ImageAssessment(
        visibleWastingProbability=round(wasting_probability, 3),
        oedemaProbability=round(oedema_probability, 3),
        riskLevel=risk_level,
        visibleSigns=visible_signs,
        qualityScore=quality_score,
        modelVersion=(
            f"mobilenetv3-trained-{TRAINED_MODEL_PATH.name}"
            if model_probability is not None
            else f"mobilenetv3-backend-{embedding_dim}"
        ),
        summary=summary,
    )
