import type { Gender, WaterSourceType } from "@/types";
import { API_BASE } from "@/lib/api";
import { getCurrentUserToken } from "@/data/userRepository";

type RiskLevel = "low" | "moderate" | "high";
type WHOStatus =
  | "normal"
  | "underweight"
  | "severe_underweight"
  | "stunted"
  | "severe_stunting"
  | "wasted"
  | "severe_wasting";

export interface BackendAssessmentInput {
  childId: string;
  childName: string;
  ageMonths: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  dietDiversity: number;
  waterSourceType: WaterSourceType;
  recentDiarrhea: boolean;
  diarrheaFrequency?: number;
  breastfed?: boolean;
  mealsPerDay?: number;
  captureMode?: "live" | "upload";
  bodyLandmarksDetected?: number;
  faceLandmarksDetected?: number;
  faceMasked?: boolean;
  modelName?: string;
  modelConfidence?: number;
  embeddingRiskHint?: number;
  qualityScore?: number;
  visibleSigns?: string[];
  // Pre-computed full ImageAssessment from /upload-image — the real ML result.
  imageAssessment?: Record<string, unknown> | null;
  maskedImageDataUrl?: string | null;
}

export interface BackendAssessmentResult {
  reportId: string;
  summary: string;
  recommendations: string[];
  privacyNote: string;
  scores: {
    whoZScore: number;
    whoStatus: WHOStatus;
    wastingScore: number;
    dietaryScore: number;
    imageScore: number;
    fusionScore: number;
    riskLevel: RiskLevel;
    imageWeight: number;
    anthroWeight: number;
    dietWeight: number;
  };
}

export interface BackendGuidanceInput {
  bodyDetected: number;
  faceDetected: number;
  bodyRequired?: number;
  faceRequired?: number;
  fullBodyVisible: boolean;
  adequateLighting: boolean;
  centered: boolean;
  distanceOk: boolean;
  headVisible: boolean;
  feetVisible: boolean;
}

export interface BackendGuidanceResult {
  readinessScore: number;
  canCapture: boolean;
  tips: Array<{
    message: string;
    severity: "info" | "warning" | "critical";
  }>;
}

export interface UploadedImageResult {
  success: boolean;
  message: string;
  maskedImagePath?: string | null;
  embeddingDim: number;
  // Full ML image assessment — must be saved to session and forwarded to /assessment.
  imageAssessment?: Record<string, unknown> | null;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getCurrentUserToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Backend request failed (${response.status}): ${body}`);
  }
  return response.json() as Promise<T>;
}

export function isBackendConfigured(): boolean {
  return true;
}

export async function checkBackendHealth(): Promise<string> {
  const data = await requestJson<{ status: string }>("/health");
  return data.status;
}

interface PythonAssessmentResponse {
  privacyNote: string;
  report: {
    id: string;
    summary: string;
    recommendations: string[];
    scores: {
      whoZScore: number;
      whoStatus: WHOStatus;
      wastingScore: number;
      dietaryScore: number;
      imageScore: number;
      fusionScore: number;
      riskLevel: RiskLevel;
      imageWeight: number;
      anthroWeight: number;
      dietWeight: number;
    };
  };
}

export async function submitAssessmentToBackend(
  input: BackendAssessmentInput,
): Promise<BackendAssessmentResult> {
  const response = await requestJson<PythonAssessmentResponse>("/assessment", {
    method: "POST",
    body: JSON.stringify({
      childId: input.childId,
      childName: input.childName,
      anthropometry: {
        ageMonths: input.ageMonths,
        gender: input.gender,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
      },
      dietary: {
        dietDiversity: input.dietDiversity,
        waterSource: input.waterSourceType,
        recentDiarrhea: input.recentDiarrhea,
        diarrheaFrequency: input.diarrheaFrequency ?? null,
        breastfed: input.breastfed ?? null,
        mealsPerDay: input.mealsPerDay ?? null,
      },
      capture: {
        mode: input.captureMode ?? "upload",
        bodyLandmarksDetected: input.bodyLandmarksDetected ?? 0,
        faceLandmarksDetected: input.faceLandmarksDetected ?? 0,
        faceMasked: input.faceMasked ?? false,
        modelName: input.modelName ?? "python-backend",
        modelConfidence: input.modelConfidence ?? 0.0,
        embeddingRiskHint: input.embeddingRiskHint ?? null,
        qualityScore: input.qualityScore ?? null,
        visibleSigns: input.visibleSigns ?? [],
        // Forward the pre-computed ML image assessment so the backend uses it
        // as the primary signal instead of running a blind heuristic.
        imageAssessment: input.imageAssessment ?? null,
      },
      originalImage: null,
      maskedImage: input.maskedImageDataUrl
        ? {
            dataUrl: input.maskedImageDataUrl,
            contentType: "image/jpeg",
          }
        : null,
    }),
  });

  return {
    reportId: response.report.id,
    summary: response.report.summary,
    recommendations: response.report.recommendations,
    privacyNote: response.privacyNote,
    scores: response.report.scores,
  };
}

export async function evaluateCaptureGuidance(
  input: BackendGuidanceInput,
): Promise<BackendGuidanceResult> {
  return requestJson<BackendGuidanceResult>("/guidance", {
    method: "POST",
    body: JSON.stringify({
      bodyDetected: input.bodyDetected,
      faceDetected: input.faceDetected,
      bodyRequired: input.bodyRequired ?? 33,
      faceRequired: input.faceRequired ?? 468,
      fullBodyVisible: input.fullBodyVisible,
      adequateLighting: input.adequateLighting,
      centered: input.centered,
      distanceOk: input.distanceOk,
      headVisible: input.headVisible,
      feetVisible: input.feetVisible,
    }),
  });
}

export async function uploadImageToBackend(params: {
  childId: string;
  mode: "live" | "upload";
  phase: "face" | "body" | "upload";
  file: File;
}): Promise<UploadedImageResult> {
  const formData = new FormData();
  formData.append("childId", params.childId);
  formData.append("mode", params.mode);
  formData.append("phase", params.phase);
  formData.append("image", params.file);

  const token = await getCurrentUserToken();
  const response = await fetch(`${API_BASE}/upload-image`, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upload failed (${response.status}): ${body}`);
  }
  return response.json() as Promise<UploadedImageResult>;
}

export async function chatWithAssistant(message: string): Promise<string> {
  const response = await requestJson<{ response: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return response.response;
}
