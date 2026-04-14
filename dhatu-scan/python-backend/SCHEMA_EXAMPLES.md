# Backend Image Assessment Shape

`POST /upload-image` should return:

```json
{
  "success": true,
  "message": "Image analyzed successfully",
  "mode": "upload",
  "phase": "upload",
  "maskedImagePath": "masked_images/child_upload_x.jpg",
  "embeddingDim": 576,
  "imageAssessment": {
    "visibleWastingProbability": 0.74,
    "oedemaProbability": 0.08,
    "riskLevel": "high",
    "visibleSigns": ["Reduced shoulder breadth", "Gaunt facial pattern"],
    "qualityScore": 82,
    "modelVersion": "mobilenetv3-backend-576",
    "summary": "Visible malnutrition signs detected in the uploaded image."
  }
}
```

`POST /assessment` should return:

```json
{
  "privacyNote": "Original image is discarded immediately. Only face-masked image is retained when explicitly requested.",
  "report": {
    "id": "rpt_123",
    "childId": "child_1",
    "childName": "Aarav",
    "createdAt": "2026-04-14T12:30:00Z",
    "capture": {
      "mode": "upload",
      "bodyLandmarksDetected": 33,
      "faceLandmarksDetected": 468,
      "faceMasked": true,
      "modelName": "mobilenetv3-backend-576",
      "modelConfidence": 0.81,
      "embeddingRiskHint": 72,
      "qualityScore": 82,
      "visibleSigns": ["Reduced shoulder breadth"]
    },
    "scores": {
      "whoZScore": -2.41,
      "whoStatus": "wasted",
      "wastingScore": 74,
      "dietaryScore": 61,
      "fusionScore": 71,
      "riskLevel": "high"
    },
    "summary": "WHO growth result indicates wasted. Combined screening risk is high. Visible malnutrition signs detected in the uploaded image.",
    "recommendations": [
      "Refer child for urgent pediatric nutrition evaluation."
    ],
    "maskedImage": {
      "path": "masked_images/child_upload_x.jpg",
      "contentType": "image/jpeg"
    },
    "imageAssessment": {
      "visibleWastingProbability": 0.74,
      "oedemaProbability": 0.08,
      "riskLevel": "high",
      "visibleSigns": ["Reduced shoulder breadth"],
      "qualityScore": 82,
      "modelVersion": "mobilenetv3-backend-576",
      "summary": "Visible malnutrition signs detected in the uploaded image."
    }
  }
}
```
