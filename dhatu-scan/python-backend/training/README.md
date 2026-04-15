# Training Scaffold (WHO Malnutrition Source)

Dataset reference currently configured:

- https://platform.who.int/nutrition/malnutrition-database/database-search

This project now keeps the WHO source URL in backend (`/training-source`) and
provides a TensorFlow MobileNetV3 training scaffold in `train_mobilenetv3.py`.

## Expected local dataset layout

- `python-backend/training/data/images/` (training images)
- `python-backend/training/data/labels.csv` with columns:
  - `image_name`
  - `label` (0/1 for non-malnourished/malnourished, placeholder scheme)
- Optional `python-backend/training/data/_annotations.csv` with columns like:
  - `filename`
  - `class` (`Healthy` / `Malnourished`)
- Legacy fallback also supported: `python-backend/training/data/images/_annotations.csv`
- Optional metadata spreadsheet in `python-backend/training/data/`:
  - `.xlsx`, `.xls`, or `.csv`
  - should include an image name column plus optional `weight`, `height`, `age_months`

## Run scaffold

```bash
cd python-backend
python -m training.train_mobilenetv3
```

## Notes

- The trainer now merges direct labels, annotation CSV labels, and optional spreadsheet metadata.
- If the dataset is too small or class-imbalanced for a meaningful split, the script stops with an explicit error instead of training a misleading model.
