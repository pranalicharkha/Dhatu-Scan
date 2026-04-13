from __future__ import annotations

from pathlib import Path

import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.applications import MobileNetV3Small
from tensorflow.keras.applications.mobilenet_v3 import preprocess_input


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
IMAGES_DIR = DATA_DIR / "images"
LABELS_CSV = DATA_DIR / "labels.csv"


def _build_dataset(frame: pd.DataFrame, batch_size: int = 16):
    paths = frame["image_path"].tolist()
    labels = frame["label"].astype("float32").tolist()

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))

    def _load(path, label):
        image = tf.io.read_file(path)
        image = tf.image.decode_jpeg(image, channels=3)
        image = tf.image.resize(image, (224, 224))
        image = preprocess_input(image)
        return image, label

    return ds.map(_load, num_parallel_calls=tf.data.AUTOTUNE).batch(batch_size).prefetch(tf.data.AUTOTUNE)


def main() -> None:
    if not LABELS_CSV.exists():
        raise FileNotFoundError(f"Missing labels file: {LABELS_CSV}")

    frame = pd.read_csv(LABELS_CSV)
    if "image_name" not in frame.columns or "label" not in frame.columns:
        raise ValueError("labels.csv must contain columns: image_name,label")

    frame["image_path"] = frame["image_name"].map(lambda name: str(IMAGES_DIR / name))
    frame = frame[frame["image_path"].map(lambda p: Path(p).exists())]
    if frame.empty:
        raise RuntimeError("No valid training images found in training/data/images")

    train_df, val_df = train_test_split(
        frame,
        test_size=0.2,
        random_state=42,
        stratify=frame["label"],
    )

    train_ds = _build_dataset(train_df)
    val_ds = _build_dataset(val_df)

    backbone = MobileNetV3Small(
        include_top=False,
        weights="imagenet",
        input_shape=(224, 224, 3),
        pooling="avg",
    )
    backbone.trainable = False

    inputs = tf.keras.Input(shape=(224, 224, 3))
    x = backbone(inputs, training=False)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid")(x)
    model = tf.keras.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )

    model.fit(train_ds, validation_data=val_ds, epochs=5)
    out_dir = ROOT / "artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)
    model.save(out_dir / "mobilenetv3_malnutrition.keras")
    print(f"Saved model to {out_dir / 'mobilenetv3_malnutrition.keras'}")


if __name__ == "__main__":
    main()
