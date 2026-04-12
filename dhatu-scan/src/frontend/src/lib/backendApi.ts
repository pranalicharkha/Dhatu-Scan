import type { Gender, WaterSourceType } from "@/types";

type RiskLevel = "low" | "moderate" | "high";
type WHOStatus = "normal" | "underweight" | "stunted" | "wasted" | "severe_wasting";

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
    fusionScore: number;
    riskLevel: RiskLevel;
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

function getBaseUrl(): string {
  const envUrl =
    import.meta.env.VITE_PY_BACKEND_URL ??
    import.meta.env.PY_BACKEND_URL ??
    "";
  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, "");
  }
  return "http://127.0.0.1:8000";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
      fusionScore: number;
      riskLevel: RiskLevel;
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
      },
      originalImage: null,
      maskedImage: null,
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
