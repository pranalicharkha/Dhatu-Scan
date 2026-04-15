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


def apply_face_mask(image_bgr: Any, phase: str = "upload"):
    if not dependencies_ready():
        return image_bgr, False
    cascade = cv2.CascadeClassifier(
        str(Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml")
    )
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4, minSize=(36, 36))
    masked = image_bgr.copy()
    masked_any = False
    for (x, y, w, h) in faces:
        # Expand detected face area so full head is anonymized.
        pad_x = int(w * 0.28)
        pad_top = int(h * 0.35)
        pad_bottom = int(h * 0.25)
        x0 = max(0, x - pad_x)
        y0 = max(0, y - pad_top)
        x1 = min(masked.shape[1], x + w + pad_x)
        y1 = min(masked.shape[0], y + h + pad_bottom)

        face_roi = masked[y0:y1, x0:x1]
        if face_roi.size == 0:
            continue
        # Use heavy pixelation + blur for stronger de-identification.
        small_w = max(8, (x1 - x0) // 14)
        small_h = max(8, (y1 - y0) // 14)
        tiny = cv2.resize(face_roi, (small_w, small_h), interpolation=cv2.INTER_LINEAR)
        pixelated = cv2.resize(tiny, (x1 - x0, y1 - y0), interpolation=cv2.INTER_NEAREST)
        blurred = cv2.GaussianBlur(pixelated, (61, 61), 45)
        masked[y0:y1, x0:x1] = blurred
        masked_any = True

    # For explicit face capture, ensure privacy even if detector misses.
    if phase == "face" and not masked_any:
        h, w = masked.shape[:2]
        cx, cy = w // 2, int(h * 0.36)
        rx, ry = int(w * 0.22), int(h * 0.2)
        x0 = max(0, cx - rx)
        x1 = min(w, cx + rx)
        y0 = max(0, cy - ry)
        y1 = min(h, cy + ry)
        roi = masked[y0:y1, x0:x1]
        if roi.size > 0:
            blurred = cv2.GaussianBlur(roi, (71, 71), 50)
            masked[y0:y1, x0:x1] = blurred
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
