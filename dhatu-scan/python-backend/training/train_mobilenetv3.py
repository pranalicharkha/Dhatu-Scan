from __future__ import annotations

from pathlib import Path
from typing import Iterable

import pandas as pd
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
IMAGES_DIR = DATA_DIR / "images"
LABELS_CSV = DATA_DIR / "labels.csv"
ANNOTATIONS_CSV = DATA_DIR / "_annotations.csv"
ANNOTATIONS_TXT = DATA_DIR / "_annotations.txt"
LEGACY_ANNOTATIONS_CSV = IMAGES_DIR / "_annotations.csv"
ARTIFACTS_DIR = ROOT / "artifacts"

IMAGE_NAME_COLUMNS = ("image_name", "filename", "file_name", "image", "name")
WEIGHT_COLUMNS = ("weight", "weight_kg", "weightkg", "wt")
HEIGHT_COLUMNS = ("height", "height_cm", "heightcm", "ht", "length_cm", "length")
AGE_COLUMNS = ("age_months", "agemonths", "age", "months")


def _standardize_columns(frame: pd.DataFrame) -> pd.DataFrame:
    renamed = {
        column: column.strip().lower().replace(" ", "_").replace("-", "_")
        for column in frame.columns
    }
    return frame.rename(columns=renamed)


def _pick_column(columns: Iterable[str], candidates: tuple[str, ...]) -> str | None:
    column_set = set(columns)
    for candidate in candidates:
        if candidate in column_set:
            return candidate
    return None


def _load_direct_labels() -> pd.DataFrame:
    if not LABELS_CSV.exists():
        return pd.DataFrame(columns=["image_name", "label"])

    frame = _standardize_columns(pd.read_csv(LABELS_CSV))
    image_col = _pick_column(frame.columns, IMAGE_NAME_COLUMNS)
    if image_col is None or "label" not in frame.columns:
        raise ValueError("labels.csv must contain image name and label columns.")

    result = frame[[image_col, "label"]].rename(columns={image_col: "image_name"}).copy()
    if result["label"].isin([-1]).any():
        raise ValueError(
            "labels.csv still contains placeholder label -1. "
            "Please replace with 0 (healthy) or 1 (malnourished)."
        )
    if not result["label"].isin([0, 1]).all():
        raise ValueError("All labels in labels.csv must be either 0 or 1.")
    return result


def _load_annotation_labels() -> pd.DataFrame:
    frames: list[pd.DataFrame] = []

    annotations_path = ANNOTATIONS_CSV if ANNOTATIONS_CSV.exists() else LEGACY_ANNOTATIONS_CSV
    if annotations_path.exists():
        frame = _standardize_columns(pd.read_csv(annotations_path))
        image_col = _pick_column(frame.columns, IMAGE_NAME_COLUMNS)
        class_col = _pick_column(frame.columns, ("class", "label"))
        if image_col is None or class_col is None:
            raise ValueError("_annotations.csv must contain filename and class/label columns.")

        label_map = {
            "malnourished": 1,
            "healthy": 0,
            "normal": 0,
            "non_malnourished": 0,
            "non-malnourished": 0,
        }

        rows: list[dict[str, object]] = []
        for _, row in frame.iterrows():
            raw_value = str(row[class_col]).strip().lower()
            if raw_value not in label_map:
                continue
            rows.append(
                {
                    "image_name": str(row[image_col]).strip(),
                    "label": label_map[raw_value],
                }
            )

        frames.append(pd.DataFrame(rows, columns=["image_name", "label"]))

    if ANNOTATIONS_TXT.exists():
        txt_rows: list[dict[str, object]] = []
        for raw_line in ANNOTATIONS_TXT.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line:
                continue

            parts = line.split()
            image_name = parts[0].strip()
            class_ids = {
                int(box.split(",")[-1])
                for box in parts[1:]
                if box.count(",") == 4 and box.split(",")[-1].isdigit()
            }
            if len(class_ids) != 1:
                continue

            class_id = class_ids.pop()
            if class_id not in {0, 1}:
                continue
            txt_rows.append({"image_name": image_name, "label": class_id})

        frames.append(pd.DataFrame(txt_rows, columns=["image_name", "label"]))

    if not frames:
        return pd.DataFrame(columns=["image_name", "label"])

    return pd.concat(frames, ignore_index=True).drop_duplicates("image_name")


def _load_metadata() -> pd.DataFrame:
    candidates = [
        path
        for path in DATA_DIR.glob("*")
        if path.is_file() and path.name not in {LABELS_CSV.name}
    ]
    spreadsheet = next((path for path in candidates if path.suffix.lower() in {".xlsx", ".xls"}), None)
    if spreadsheet is None:
        csv_candidate = next(
            (
                path
                for path in candidates
                if path.suffix.lower() == ".csv" and path.name != LABELS_CSV.name
            ),
            None,
        )
        spreadsheet = csv_candidate

    if spreadsheet is None:
        return pd.DataFrame(columns=["image_name", "weight_kg", "height_cm", "age_months"])

    if spreadsheet.suffix.lower() == ".csv":
        frame = pd.read_csv(spreadsheet)
    else:
        frame = pd.read_excel(spreadsheet)

    frame = _standardize_columns(frame)
    image_col = _pick_column(frame.columns, IMAGE_NAME_COLUMNS)
    if image_col is None:
        return pd.DataFrame(columns=["image_name", "weight_kg", "height_cm", "age_months"])

    result = pd.DataFrame({"image_name": frame[image_col].astype(str).str.strip()})

    weight_col = _pick_column(frame.columns, WEIGHT_COLUMNS)
    height_col = _pick_column(frame.columns, HEIGHT_COLUMNS)
    age_col = _pick_column(frame.columns, AGE_COLUMNS)

    if weight_col is not None:
        result["weight_kg"] = pd.to_numeric(frame[weight_col], errors="coerce")
    if height_col is not None:
        result["height_cm"] = pd.to_numeric(frame[height_col], errors="coerce")
    if age_col is not None:
        result["age_months"] = pd.to_numeric(frame[age_col], errors="coerce")

    return result.drop_duplicates("image_name")


def _build_manifest() -> tuple[pd.DataFrame, list[str]]:
    notes: list[str] = []

    direct = _load_direct_labels()
    annotations = _load_annotation_labels()
    metadata = _load_metadata()

    manifest = pd.concat([direct, annotations], ignore_index=True)
    if manifest.empty:
        raise RuntimeError("No labels found. Add labels.csv or images/_annotations.csv.")

    manifest = manifest.drop_duplicates("image_name", keep="first")
    manifest["image_path"] = manifest["image_name"].map(lambda name: str(IMAGES_DIR / name))
    manifest["image_exists"] = manifest["image_path"].map(lambda path: Path(path).exists())

    missing = manifest.loc[~manifest["image_exists"], "image_name"].tolist()
    if missing:
        notes.append(
            f"Skipped {len(missing)} labeled rows because the image files are missing from {IMAGES_DIR}."
        )
    manifest = manifest[manifest["image_exists"]].copy()
    manifest = manifest.drop(columns=["image_exists"])

    if not metadata.empty:
        manifest = manifest.merge(metadata, on="image_name", how="left")
        for column in ("weight_kg", "height_cm", "age_months"):
            if column not in manifest.columns:
                manifest[column] = pd.NA
    else:
        manifest["weight_kg"] = pd.NA
        manifest["height_cm"] = pd.NA
        manifest["age_months"] = pd.NA

    if manifest.empty:
        raise RuntimeError("No valid training images found after matching labels to image files.")
    if manifest["label"].nunique() < 2:
        raise RuntimeError("Need both healthy and malnourished examples to train the model.")

    return manifest.reset_index(drop=True), notes


def _split_manifest(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    label_counts = frame["label"].value_counts()
    min_class_count = int(label_counts.min())
    if len(frame) < 8 or min_class_count < 2:
        raise RuntimeError(
            "Dataset is too small for a reliable train/validation split. "
            f"Found {len(frame)} usable images with class counts {label_counts.to_dict()}."
        )

    return train_test_split(
        frame,
        test_size=0.2,
        random_state=42,
        stratify=frame["label"],
    )


def _build_dataset(frame: pd.DataFrame, batch_size: int = 16, include_meta: bool = False):
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v3 import preprocess_input

    paths = frame["image_path"].tolist()
    labels = frame["label"].astype("float32").tolist()
    meta_values = (
        frame[["weight_kg", "height_cm", "age_months"]]
        .fillna(0)
        .astype("float32")
        .values
        .tolist()
    )

    if include_meta:
        ds = tf.data.Dataset.from_tensor_slices((paths, meta_values, labels))
    else:
        ds = tf.data.Dataset.from_tensor_slices((paths, labels))

    def _load_image(path):
        image = tf.io.read_file(path)
        image = tf.image.decode_image(image, channels=3, expand_animations=False)
        image = tf.image.resize(image, (224, 224))
        image = preprocess_input(image)
        return image

    if include_meta:
        def _load(path, meta, label):
            image = _load_image(path)
            return {"image": image, "meta": meta}, label
    else:
        def _load(path, label):
            image = _load_image(path)
            return image, label

    return (
        ds.map(_load, num_parallel_calls=tf.data.AUTOTUNE)
        .batch(batch_size)
        .prefetch(tf.data.AUTOTUNE)
    )


def _build_model(include_meta: bool = False):
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV3Small

    backbone = MobileNetV3Small(
        include_top=False,
        weights="imagenet",
        input_shape=(224, 224, 3),
        pooling="avg",
    )
    backbone.trainable = False

    image_input = tf.keras.Input(shape=(224, 224, 3), name="image")
    image_features = backbone(image_input, training=False)
    image_features = tf.keras.layers.Dropout(0.2)(image_features)

    if include_meta:
        meta_input = tf.keras.Input(shape=(3,), name="meta")
        meta_features = tf.keras.layers.Dense(16, activation="relu")(meta_input)
        merged = tf.keras.layers.Concatenate()([image_features, meta_features])
        merged = tf.keras.layers.Dense(64, activation="relu")(merged)
        merged = tf.keras.layers.Dropout(0.2)(merged)
        outputs = tf.keras.layers.Dense(1, activation="sigmoid")(merged)
        model = tf.keras.Model([image_input, meta_input], outputs)
    else:
        outputs = tf.keras.layers.Dense(1, activation="sigmoid")(image_features)
        model = tf.keras.Model(image_input, outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )
    return model


def main() -> None:
    manifest, notes = _build_manifest()
    train_df, val_df = _split_manifest(manifest)
    include_meta = (
        manifest[["weight_kg", "height_cm"]].notna().any().all()
        if {"weight_kg", "height_cm"}.issubset(manifest.columns)
        else False
    )

    train_ds = _build_dataset(train_df, include_meta=include_meta)
    val_ds = _build_dataset(val_df, include_meta=include_meta)
    model = _build_model(include_meta=include_meta)

    print(f"Training on {len(train_df)} images, validating on {len(val_df)} images.")
    print(f"Class balance: {manifest['label'].value_counts().to_dict()}")
    if include_meta:
        print("Using weight/height/age metadata alongside image features.")
    for note in notes:
        print(note)

    model.fit(train_ds, validation_data=val_ds, epochs=5)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    model.save(ARTIFACTS_DIR / "mobilenetv3_malnutrition.keras")
    manifest.to_csv(ARTIFACTS_DIR / "training_manifest.csv", index=False)
    print(f"Saved model to {ARTIFACTS_DIR / 'mobilenetv3_malnutrition.keras'}")
    print(f"Saved manifest to {ARTIFACTS_DIR / 'training_manifest.csv'}")


if __name__ == "__main__":
    main()
