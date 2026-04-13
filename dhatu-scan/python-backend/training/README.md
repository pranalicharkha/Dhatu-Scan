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

## Run scaffold

```bash
cd python-backend
python -m training.train_mobilenetv3
```
