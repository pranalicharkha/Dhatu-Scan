from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from uuid import uuid4

try:
    import cv2
    import numpy as np
except ImportError:  # pragma: no cover
    cv2 = None
    np = None


@dataclass
class PreprocessArtifacts:
    masked_path: str | None
    embedding: Any
    embedding_dim: int
    face_masked: bool


def dependencies_ready() -> bool:
    return cv2 is not None and np is not None


def decode_upload_image(content: bytes):
    if not dependencies_ready():
      return None
    np_bytes = np.frombuffer(content, dtype=np.uint8)
    return cv2.imdecode(np_bytes, cv2.IMREAD_COLOR)


def apply_face_mask(image_bgr: Any):
    if not dependencies_ready():
        return image_bgr, False
    cascade = cv2.CascadeClassifier(
        str(Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml")
    )
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    masked = image_bgr.copy()
    masked_any = False
    for (x, y, w, h) in faces:
        face_roi = masked[y : y + h, x : x + w]
        if face_roi.size == 0:
            continue
        blurred = cv2.GaussianBlur(face_roi, (55, 55), 30)
        masked[y : y + h, x : x + w] = blurred
        masked_any = True
    return masked, masked_any


def save_masked_image(masked_bgr: Any, child_id: str, phase: str, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    masked_name = f"{child_id}_{phase}_{uuid4().hex}.jpg"
    masked_path = output_dir / masked_name
    if dependencies_ready() and masked_bgr is not None:
        cv2.imwrite(str(masked_path), masked_bgr)
        return str(masked_path)
    return None
