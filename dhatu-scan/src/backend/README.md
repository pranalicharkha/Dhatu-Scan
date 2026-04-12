# Dhatu-Scan Backend API (Motoko)

## What this backend now does

- Accepts live-camera or uploaded-photo pipeline metadata.
- Returns live capture guidance for 33 body + 468 face landmark readiness.
- Computes:
  - WHO Z-score and WHO status
  - Wasting score
  - Dietary risk score
  - Final fusion score
- Generates and stores a professional report with recommendations.
- Applies privacy-first handling:
  - `originalImage` is accepted only transiently and never stored.
  - Only `maskedImage` is optionally retained.

## Public methods

- `healthCheck() -> text`
- `evaluateGuidance(LandmarkVisibility) -> GuidanceResponse` (query)
- `generateAssessmentReport(AssessmentRequest) -> AssessmentResponse`
- `getReport(text) -> opt Report` (query)
- `listReports(opt text) -> vec Report` (query)
- `deleteReport(text) -> bool`

## Core request model

- `AssessmentRequest`
  - `childId`, `childName`
  - `anthropometry`: age, gender, height, weight
  - `dietary`: diet diversity, water source, diarrhea signals
  - `capture`: live/upload, landmarks detected, model metadata, optional `embeddingRiskHint`
  - `originalImage` (optional, dropped immediately)
  - `maskedImage` (optional, retained)

## Integration note

`embeddingRiskHint` is where your MobileNetV3/AI-ML stage can pass a normalized visual-risk hint (`0-100`) after landmarking + face masking.  
If not provided, fusion falls back to anthropometry-driven wasting score behavior.

## Build/generation commands

From project root:

- `mops check`
- `mops build`
- `pnpm bindgen`

If you are on native Windows and `ic-mops` says unsupported, run these in WSL.
