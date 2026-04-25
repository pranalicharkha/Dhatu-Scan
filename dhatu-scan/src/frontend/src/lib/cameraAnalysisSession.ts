export interface CameraAnalysisSession {
  ready: boolean;
  mode: "live" | "upload";
  processedImageDataUrl: string;
  maskedImageDataUrl: string;
  bodyLandmarksDetected: number;
  faceLandmarksDetected: number;
  faceMasked: boolean;
  modelName: string;
  modelConfidence: number;
  imageRiskScore: number;
  qualityScore: number;
  visibleSigns: string[];
  // Full image assessment returned by /upload-image — carries the real ML output.
  imageAssessment?: Record<string, unknown> | null;
}

const STORAGE_KEY = "dhatu_camera_analysis_session";

export function saveCameraAnalysisSession(
  session: CameraAnalysisSession | null,
): void {
  if (!session) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getCameraAnalysisSession(): CameraAnalysisSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CameraAnalysisSession;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearCameraAnalysisSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
