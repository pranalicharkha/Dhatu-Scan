import GlassCard from "@/components/GlassCard";
import {
  clearCameraAnalysisSession,
  saveCameraAnalysisSession,
  type CameraAnalysisSession,
} from "@/lib/cameraAnalysisSession";
import {
  evaluateCaptureGuidance,
  isBackendConfigured,
  uploadImageToBackend,
} from "@/lib/backendApi";
import { preprocessAndAnalyzeImage } from "@/lib/mlImagePipeline";
import { useNavigate } from "@tanstack/react-router";
import {
  AlignCenter,
  Camera as CameraIcon,
  CheckCircle,
  Eye,
  Lightbulb,
  Lock,
  Maximize2,
  MoveLeft,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { sendImageToBackend } from "../utils/api";
// ── Guidance tips ─────────────────────────────────────────────────────────────
const TIPS = [
  {
    id: 0,
    label: "Stand 2m from camera",
    icon: Maximize2,
    color: "text-amber-400",
    bg: "bg-amber-400/15 border-amber-400/30",
  },
  {
    id: 1,
    label: "Move left slightly",
    icon: MoveLeft,
    color: "text-orange-400",
    bg: "bg-orange-400/15 border-orange-400/30",
  },
  {
    id: 2,
    label: "Stand straight",
    icon: AlignCenter,
    color: "text-emerald-400",
    bg: "bg-emerald-400/15 border-emerald-400/30",
  },
  {
    id: 3,
    label: "Good lighting needed",
    icon: Lightbulb,
    color: "text-yellow-400",
    bg: "bg-yellow-400/15 border-yellow-400/30",
  },
  {
    id: 4,
    label: "Full body must be visible",
    icon: Eye,
    color: "text-primary",
    bg: "bg-primary/15 border-primary/30",
  },
] as const;

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Camera Capture", step: 1 },
  { label: "Child Details", step: 2 },
  { label: "Results", step: 3 },
] as const;

type CaptureState = "idle" | "scanning" | "complete";
type CapturePhase = "face" | "body" | "complete";
type InputMode = "capture" | "upload";

const FACE_LANDMARK_TARGET = 468;
const FACE_LANDMARK_MIN_READY = 420;
const BODY_LANDMARK_TARGET = 33;
const BODY_LANDMARK_MIN_READY = 27;

declare global {
  interface Window {
    FaceMesh?: new (config: {
      locateFile: (file: string) => string;
    }) => {
      setOptions: (opts: Record<string, unknown>) => void;
      onResults: (cb: (results: { multiFaceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>> }) => void) => void;
      send: (payload: { image: HTMLVideoElement | HTMLImageElement }) => Promise<void>;
      close?: () => void;
    };
    Pose?: new (config: {
      locateFile: (file: string) => string;
    }) => {
      setOptions: (opts: Record<string, unknown>) => void;
      onResults: (cb: (results: { poseLandmarks?: Array<{ x: number; y: number; visibility?: number }> }) => void) => void;
      send: (payload: { image: HTMLVideoElement | HTMLImageElement }) => Promise<void>;
      close?: () => void;
    };
  }
}

async function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

type LandmarkDetector = {
  send: (payload: { image: HTMLVideoElement | HTMLImageElement }) => Promise<void>;
  onResults: (cb: (results: any) => void) => void;
  close?: () => void;
};

export default function Camera() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<LandmarkDetector | null>(null);
  const poseRef = useRef<LandmarkDetector | null>(null);
  const uploadFaceMeshRef = useRef<LandmarkDetector | null>(null);
  const uploadPoseRef = useRef<LandmarkDetector | null>(null);
  const latestFaceLandmarksRef = useRef<Array<{ x: number; y: number; z?: number }>>([]);
  const latestPoseLandmarksRef = useRef<Array<{ x: number; y: number; visibility?: number }>>([]);
  const faceCaptureLandmarksRef = useRef<Array<{ x: number; y: number; z?: number }>>([]);
  const bodyCaptureFaceLandmarksRef = useRef<Array<{ x: number; y: number; z?: number }>>([]);
  const bodyCapturePoseLandmarksRef = useRef<Array<{ x: number; y: number; visibility?: number }>>([]);
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inferenceBusyRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("capture");
  const [tipIndex, setTipIndex] = useState(0);
  const [liveTip, setLiveTip] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(72);
  const [canCapture, setCanCapture] = useState(true);
  const [bodyDetectedCount, setBodyDetectedCount] = useState(0);
  const [faceDetectedCount, setFaceDetectedCount] = useState(0);
  const [capturePhase, setCapturePhase] = useState<CapturePhase>("face");
  const [faceCaptureDataUrl, setFaceCaptureDataUrl] = useState<string | null>(
    null,
  );
  const [bodyCaptureDataUrl, setBodyCaptureDataUrl] = useState<string | null>(
    null,
  );
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadConfirmMsg, setUploadConfirmMsg] = useState<string | null>(null);
  const [uploadBodyDetectedCount, setUploadBodyDetectedCount] = useState(0);
  const [uploadFaceDetectedCount, setUploadFaceDetectedCount] = useState(0);
  const [uploadAnalyzing, setUploadAnalyzing] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [processedSession, setProcessedSession] = useState<CameraAnalysisSession | null>(null);

  useEffect(() => {
    if (inputMode === "upload") {
      setCaptureState("idle");
      setCapturePhase("face");
      setCanCapture(false);
      setLiveTip("Upload mode enabled.");
      setFaceCaptureDataUrl(null);
      setBodyCaptureDataUrl(null);
      setSessionReady(false);
      setProcessedSession(null);
      clearCameraAnalysisSession();
      return;
    }
    setUploadConfirmMsg(null);
    setUploadBodyDetectedCount(0);
    setUploadFaceDetectedCount(0);
    setLiveTip(null);
    setFaceCaptureDataUrl(null);
    setBodyCaptureDataUrl(null);
    setSessionReady(false);
    setProcessedSession(null);
    clearCameraAnalysisSession();
  }, [inputMode]);

  useEffect(() => {
    return () => {
      uploadFaceMeshRef.current?.close?.();
      uploadPoseRef.current?.close?.();
      uploadFaceMeshRef.current = null;
      uploadPoseRef.current = null;
    };
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, []);

  const persistProcessedSession = useCallback((session: CameraAnalysisSession) => {
    saveCameraAnalysisSession(session);
    setProcessedSession(session);
    setSessionReady(true);
  }, []);

  const processCapturedImage = useCallback(
    async (
      rawImageDataUrl: string,
      faceLandmarks: Array<{ x: number; y: number; z?: number }>,
      poseLandmarks: Array<{ x: number; y: number; visibility?: number }>,
      faceDetected: number,
      bodyDetected: number,
      mode: "live" | "upload",
    ) => {
      const mlResult = await preprocessAndAnalyzeImage({
        sourceDataUrl: rawImageDataUrl,
        faceLandmarks,
        poseLandmarks,
      });

      const session: CameraAnalysisSession = {
        ready: true,
        mode,
        processedImageDataUrl: mlResult.processedImageDataUrl,
        maskedImageDataUrl: mlResult.maskedImageDataUrl,
        bodyLandmarksDetected: bodyDetected,
        faceLandmarksDetected: faceDetected,
        faceMasked: mlResult.faceMasked,
        modelName: mlResult.modelName,
        modelConfidence: mlResult.modelConfidence,
        imageRiskScore: mlResult.imageRiskScore,
        qualityScore: mlResult.qualityScore,
        visibleSigns: mlResult.visibleSigns,
      };

      persistProcessedSession(session);
      return session;
    },
    [persistProcessedSession],
  );

  // ── Camera init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (inputMode !== "capture") {
        setCameraReady(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", aspectRatio: { ideal: 9 / 16 } },
          audio: false,
        });
        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        if (!cancelled) setCameraError(true);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
        streamRef.current = null;
      }
    };
  }, [inputMode]);

  // ── Real-time landmark guidance (MediaPipe Pose + FaceMesh) ────────────────
  useEffect(() => {
    if (inputMode !== "capture" || !cameraReady || !videoRef.current) {
      return;
    }

    let cancelled = false;

    const estimateBrightness = (video: HTMLVideoElement): number => {
      if (!measureCanvasRef.current) {
        measureCanvasRef.current = document.createElement("canvas");
      }
      const canvas = measureCanvasRef.current;
      const width = Math.max(32, Math.floor(video.videoWidth / 8));
      const height = Math.max(32, Math.floor(video.videoHeight / 8));
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0.5;
      ctx.drawImage(video, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      }
      return sum / (width * height * 255);
    };

    async function initMediapipe() {
      try {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
        );
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");

        if (cancelled || !window.FaceMesh || !window.Pose) {
          return;
        }

        const faceMesh = new window.FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        faceMesh.onResults((results) => {
          latestFaceLandmarksRef.current = results.multiFaceLandmarks?.[0] ?? [];
        });

        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        pose.onResults((results) => {
          latestPoseLandmarksRef.current = results.poseLandmarks ?? [];
        });

        faceMeshRef.current = faceMesh;
        poseRef.current = pose;
      } catch {
        // If MediaPipe fails to load, preserve fallback behavior below.
      }
    }

    async function tick() {
      const video = videoRef.current;
      if (cancelled || !video) return;
      if (inferenceBusyRef.current) return;
      if (video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) {
        return;
      }

      setTipIndex((i) => (i + 1) % TIPS.length);

      if (!isBackendConfigured()) {
        setConfidence(65 + Math.floor(Math.random() * 30));
        setCanCapture(true);
        setLiveTip(null);
        return;
      }

      try {
        inferenceBusyRef.current = true;
        if (poseRef.current) {
          await poseRef.current.send({ image: video });
        }
        if (faceMeshRef.current) {
          await faceMeshRef.current.send({ image: video });
        }

        const poseLandmarks = latestPoseLandmarksRef.current;
        const faceLandmarks = latestFaceLandmarksRef.current;
        const bodyDetected = poseLandmarks.filter(
          (p) => (p.visibility ?? 1) > 0.4,
        ).length;
        const faceDetected = Math.min(faceLandmarks.length, FACE_LANDMARK_TARGET);

        const xs = poseLandmarks.map((p) => p.x);
        const ys = poseLandmarks.map((p) => p.y);
        const centerX =
          xs.length > 0 ? xs.reduce((sum, x) => sum + x, 0) / xs.length : 0.5;
        const minY = ys.length > 0 ? Math.min(...ys) : 0;
        const maxY = ys.length > 0 ? Math.max(...ys) : 1;
        const bodyHeight = maxY - minY;
        const minX = xs.length > 0 ? Math.min(...xs) : 0;
        const maxX = xs.length > 0 ? Math.max(...xs) : 1;
        const bodyWidth = maxX - minX;
        const bodyBoxArea = Math.max(0, bodyWidth * bodyHeight);

        const faceXs = faceLandmarks.map((p) => p.x);
        const faceYs = faceLandmarks.map((p) => p.y);
        const faceMinX = faceXs.length > 0 ? Math.min(...faceXs) : 0;
        const faceMaxX = faceXs.length > 0 ? Math.max(...faceXs) : 1;
        const faceMinY = faceYs.length > 0 ? Math.min(...faceYs) : 0;
        const faceMaxY = faceYs.length > 0 ? Math.max(...faceYs) : 1;
        const faceBoxArea = Math.max(0, (faceMaxX - faceMinX) * (faceMaxY - faceMinY));

        const adequateLighting = estimateBrightness(video) > 0.28;
        const centered = Math.abs(centerX - 0.5) < 0.18;
        const distanceOk = bodyHeight > 0.55 && bodyHeight < 0.92;
        const fullBodyVisible = bodyDetected >= BODY_LANDMARK_MIN_READY && bodyHeight > 0.52;
        const headVisible = bodyDetected > 0 && (poseLandmarks[0]?.visibility ?? 1) > 0.4;
        const feetVisible =
          (poseLandmarks[31]?.visibility ?? 0) > 0.3 ||
          (poseLandmarks[32]?.visibility ?? 0) > 0.3;

        setBodyDetectedCount(bodyDetected);
        setFaceDetectedCount(faceDetected);

        const faceReady = faceDetected >= FACE_LANDMARK_MIN_READY && adequateLighting && centered;
        const bodyFramingOk = faceBoxArea <= 0.22 && bodyBoxArea >= 0.14 && bodyHeight >= 0.52;
        const bodyReady =
          bodyDetected >= BODY_LANDMARK_MIN_READY &&
          fullBodyVisible &&
          headVisible &&
          feetVisible &&
          centered &&
          distanceOk &&
          bodyFramingOk &&
          adequateLighting;

        if (capturePhase === "face") {
          setConfidence(
            Math.min(100, Math.round((faceDetected / FACE_LANDMARK_TARGET) * 100)),
          );
          setCanCapture(faceReady);
          if (!adequateLighting) {
            setLiveTip("Increase lighting for face close-up capture.");
          } else if (!centered) {
            setLiveTip("Center the face for close-up capture.");
          } else if (faceDetected < FACE_LANDMARK_MIN_READY) {
            setLiveTip(
              `Face landmarks: ${faceDetected}/${FACE_LANDMARK_TARGET}. Hold still.`,
            );
          } else {
            setLiveTip("Face ready. Capture close-up now.");
          }
          return;
        }

        if (capturePhase === "body") {
          if (!bodyFramingOk) {
            setCanCapture(false);
            setConfidence(Math.max(35, Math.round(bodyBoxArea * 100)));
            setLiveTip(
              faceBoxArea > 0.16
                ? "Face appears too close. Step back so full body is in frame."
                : "Move farther back and keep full body visible before body capture.",
            );
            return;
          }
          const guidance = await evaluateCaptureGuidance({
            bodyDetected,
            faceDetected,
            bodyRequired: BODY_LANDMARK_TARGET,
            faceRequired: 0,
            fullBodyVisible,
            adequateLighting,
            centered,
            distanceOk,
            headVisible,
            feetVisible,
          });
          setConfidence(guidance.readinessScore);
          const fallbackBodyReady =
            bodyDetected >= BODY_LANDMARK_MIN_READY &&
            fullBodyVisible &&
            centered &&
            adequateLighting &&
            bodyFramingOk;
          setCanCapture((bodyReady && guidance.canCapture) || fallbackBodyReady);
          setLiveTip(
            (bodyReady && guidance.canCapture) || fallbackBodyReady
              ? "Body ready. Capture full-body image now."
              : (guidance.tips[0]?.message ??
                  "Adjust posture and framing for full-body capture."),
          );
          return;
        }

        setCanCapture(false);
        setLiveTip("Face and body captures complete.");
      } catch {
        setConfidence((prev) => Math.max(50, prev - 5));
        setCanCapture(false);
        setLiveTip("Live detection unavailable. Please check camera/model loading.");
      } finally {
        inferenceBusyRef.current = false;
      }
    }

    void initMediapipe();
    const intervalId = setInterval(() => {
      void tick();
    }, 1200);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      faceMeshRef.current?.close?.();
      poseRef.current?.close?.();
      faceMeshRef.current = null;
      poseRef.current = null;
    };
  }, [cameraReady, capturePhase, inputMode]);

  // ── Capture handler ─────────────────────────────────────────────────────────
  const handleCapture = useCallback(async() => {
    if (captureState !== "idle" || !canCapture) return;
    setSessionReady(false);
    setProcessedSession(null);
    clearCameraAnalysisSession();
    setCaptureState("scanning");
    setScanProgress(0);

    const start = Date.now();
    const duration = 1500;
    const tick = async() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setScanProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        const image = captureFrame();
        if (image) {
  const response = await sendImageToBackend(image);
  console.log(response);
}
        
        if (capturePhase === "face") {
          if (image) {
            setFaceCaptureDataUrl(image);
            faceCaptureLandmarksRef.current = [...latestFaceLandmarksRef.current];
          }
          setCapturePhase("body");
          setCaptureState("idle");
          setCanCapture(false);
          setLiveTip(
            "Face captured. Step back and align full body for second capture.",
          );
          return;
        }
        if (capturePhase === "body") {
          if (!image) {
            setCaptureState("idle");
            setLiveTip("Capture failed. Please try again.");
            return;
          }
          setBodyCaptureDataUrl(image);
          bodyCaptureFaceLandmarksRef.current = [...latestFaceLandmarksRef.current];
          bodyCapturePoseLandmarksRef.current = [...latestPoseLandmarksRef.current];
          void processCapturedImage(
            image,
            bodyCaptureFaceLandmarksRef.current,
            bodyCapturePoseLandmarksRef.current,
            Math.min(bodyCaptureFaceLandmarksRef.current.length, FACE_LANDMARK_TARGET),
            bodyCapturePoseLandmarksRef.current.filter(
              (point) => (point.visibility ?? 1) > 0.4,
            ).length,
            "live",
          )
            .then((session) => {
              setBodyCaptureDataUrl(session.processedImageDataUrl);
              setCapturePhase("complete");
              setCaptureState("complete");
              setCanCapture(false);
              setLiveTip("Face and body images processed successfully.");
            })
            .catch((error) => {
              setCaptureState("idle");
              setCapturePhase("body");
              setLiveTip(
                error instanceof Error
                  ? error.message
                  : "Image processing failed. Please capture again.",
              );
            });
          return;
        }
        setCaptureState("complete");
      }
    };
    requestAnimationFrame(tick);
  }, [captureState, canCapture, captureFrame, capturePhase, processCapturedImage]);

  const getUploadDetectors = useCallback(async () => {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
    );
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");
    if (!window.FaceMesh || !window.Pose) {
      throw new Error("Landmark detector failed to load.");
    }

    if (!uploadFaceMeshRef.current) {
      const faceMesh = new window.FaceMesh({
        locateFile: (name) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${name}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45,
      });
      uploadFaceMeshRef.current = faceMesh;
    }

    if (!uploadPoseRef.current) {
      const pose = new window.Pose({
        locateFile: (name) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${name}`,
      });
      pose.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45,
      });
      uploadPoseRef.current = pose;
    }

    return {
      faceMesh: uploadFaceMeshRef.current,
      pose: uploadPoseRef.current,
    };
  }, []);

  const analyzeUploadedImage = useCallback(
    async (file: File) => {
      const { faceMesh, pose } = await getUploadDetectors();
      if (!faceMesh || !pose) {
        throw new Error("Landmark detector failed to initialize.");
      }

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.src = objectUrl;
      await image.decode();

      const maxSide = 720;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      let analysisImage: HTMLImageElement = image;
      let analysisDataUrl = objectUrl;
      if (scale < 1) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          throw new Error("Failed to prepare image for analysis.");
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const resized = new Image();
        analysisDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resized.src = analysisDataUrl;
        await resized.decode();
        analysisImage = resized;
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          throw new Error("Failed to prepare image for analysis.");
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        analysisDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      }

      let localFaceLandmarks: Array<{ x: number; y: number; z?: number }> = [];
      let localPoseLandmarks: Array<{ x: number; y: number; visibility?: number }> = [];
      faceMesh.onResults((results) => {
        localFaceLandmarks = results.multiFaceLandmarks?.[0] ?? [];
      });
      pose.onResults((results) => {
        localPoseLandmarks = results.poseLandmarks ?? [];
      });

      try {
        await pose.send({ image: analysisImage });
        await faceMesh.send({ image: analysisImage });
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      const bodyDetected = localPoseLandmarks.filter(
        (p) => (p.visibility ?? 1) > 0.4,
      ).length;
      const faceDetected = Math.min(localFaceLandmarks.length, 468);

      return {
        bodyDetected,
        faceDetected,
        faceLandmarks: localFaceLandmarks,
        poseLandmarks: localPoseLandmarks,
        analysisDataUrl,
      };
    },
    [getUploadDetectors],
  );

  const handleUploadChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = "";
      const localUrl = URL.createObjectURL(file);
      setUploadPreviewUrl(null);
      setUploadConfirmMsg(null);
      setUploadAnalyzing(true);
      setSessionReady(false);
      setProcessedSession(null);
      clearCameraAnalysisSession();

      try {
        const {
          bodyDetected,
          faceDetected,
          faceLandmarks,
          poseLandmarks,
          analysisDataUrl,
        } = await analyzeUploadedImage(file);
        setUploadBodyDetectedCount(bodyDetected);
        setUploadFaceDetectedCount(faceDetected);

        if (faceDetected < 468 || bodyDetected < 33) {
          URL.revokeObjectURL(localUrl);
          setUploadConfirmMsg(
            faceDetected === 0 && bodyDetected === 0
              ? "No face or body landmarks were detected. Upload one clear image of a single child with the full face and full body visible."
              : faceDetected < 468 && bodyDetected < 33
                ? "Face and body landmarks are incomplete. Upload one clear image with the full face (468/468) and full body (33/33) visible."
                : faceDetected < 468
                  ? `Face landmarks are incomplete (${faceDetected}/468). Upload a clearer front-facing image with the full face visible.`
                  : `Body landmarks are incomplete (${bodyDetected}/33). Upload a clearer full-body image with the whole child in frame.`,
          );
          return;
        }

        const session = await processCapturedImage(
          analysisDataUrl,
          faceLandmarks,
          poseLandmarks,
          faceDetected,
          bodyDetected,
          "upload",
        );
        setUploadPreviewUrl(session.processedImageDataUrl);

        const result = await uploadImageToBackend({
          childId: "upload_child",
          mode: "upload",
          phase: "upload",
          file: new File(
            [await (await fetch(session.processedImageDataUrl)).blob()],
            "processed-upload.jpg",
            { type: "image/jpeg" },
          ),
        });
        setUploadConfirmMsg(result.message);
      } catch (error) {
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";
        setUploadConfirmMsg(
          message.includes("landmark detector failed to initialize") ||
            message.includes("failed to load script: https://cdn.jsdelivr.net/npm/@mediapipe")
            ? "The landmark detector could not load. Check your connection and try again."
            : message.includes("tensorflow.js failed to initialize") ||
                message.includes("tfhub") ||
                message.includes("mobilenet")
              ? "The TensorFlow image model could not load, so image analysis could not finish."
              :
          message.includes("module.arguments") ||
            message.includes("aborted(") ||
            message.includes("opencv")
            ? "Image preprocessing failed to initialize. Please refresh once and try the upload again."
            : error instanceof Error
              ? error.message
              : "Upload failed",
        );
      } finally {
        URL.revokeObjectURL(localUrl);
        setUploadAnalyzing(false);
      }
    },
    [analyzeUploadedImage, processCapturedImage],
  );

  const goToForm = useCallback(() => {
    if (
      inputMode === "capture" &&
      (capturePhase !== "complete" || !faceCaptureDataUrl || !bodyCaptureDataUrl)
    ) {
      setLiveTip("Complete both face and body captures before continuing.");
      return;
    }
    if (!sessionReady) {
      setLiveTip("You can continue only after all required landmarks are detected.");
      return;
    }
    navigate({ to: "/form" });
  }, [bodyCaptureDataUrl, capturePhase, faceCaptureDataUrl, inputMode, navigate, sessionReady]);

  const currentTip = TIPS[tipIndex];
  const TipIcon = currentTip.icon;
  const displayedTip = liveTip ?? currentTip.label;
  const isHighConfidence = confidence >= 80;
  const phaseLabel =
    capturePhase === "face"
      ? "Phase 1: Face Close-up"
      : capturePhase === "body"
        ? "Phase 2: Full Body"
        : "Phase Complete";
  const guidanceBadgeClasses = canCapture
    ? `${currentTip.bg} ${currentTip.color}`
    : "bg-red-500/20 border-red-400/40 text-red-300";
  const uploadLandmarksComplete =
    uploadFaceDetectedCount >= 468 && uploadBodyDetectedCount >= 33;
  const uploadConfirmIsError =
    !!uploadConfirmMsg &&
    (uploadConfirmMsg.toLowerCase().includes("incomplete") ||
      uploadConfirmMsg.toLowerCase().includes("failed") ||
      uploadConfirmMsg.toLowerCase().includes("error") ||
      uploadConfirmMsg.toLowerCase().includes("aborted") ||
      uploadConfirmMsg.toLowerCase().includes("refresh"));
  const scanLineStyle = canCapture
    ? {
        background:
          "linear-gradient(90deg, transparent 0%, oklch(0.72 0.18 176 / 0.8) 50%, transparent 100%)",
        boxShadow: "0 0 8px oklch(0.72 0.18 176 / 0.6)",
      }
    : {
        background:
          "linear-gradient(90deg, transparent 0%, rgba(248,113,113,0.9) 50%, transparent 100%)",
        boxShadow: "0 0 10px rgba(248,113,113,0.8)",
      };
  const isDark = resolvedTheme === "dark";
  const pageBackground = isDark
    ? "radial-gradient(ellipse at 50% 0%, oklch(0.12 0.025 250) 0%, oklch(0.09 0.015 250) 100%)"
    : "radial-gradient(ellipse at 50% 0%, #F8F1E7 0%, #F2E7D9 100%)";
  const uploadPanelBackground = isDark
    ? "rgba(25, 31, 43, 0.52)"
    : "rgba(255, 247, 238, 0.86)";
  const uploadPanelHoverBackground = isDark
    ? "rgba(34, 41, 56, 0.7)"
    : "rgba(250, 238, 223, 0.96)";
  const uploadPanelBorder = isDark
    ? "rgba(255,255,255,0.15)"
    : "rgba(156, 143, 203, 0.2)";
  const mutedPreviewBackground = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(255,255,255,0.72)";

  return (
    <div
      data-ocid="camera-page"
      className="min-h-screen bg-background flex flex-col items-center pt-4 pb-24 px-4"
      style={{
        background: pageBackground,
      }}
    >
      {/* ── Step progress ─────────────────────────────────────────────────── */}
      <motion.div
        className="w-full max-w-md mb-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const active = s.step === 1;
            const done = s.step < 1;
            return (
              <div
                key={s.step}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-smooth
                    ${active ? "bg-primary border-primary text-primary-foreground" : ""}
                    ${done ? "bg-primary/60 border-primary/40 text-primary-foreground" : ""}
                    ${!active && !done ? "border-white/20 text-muted-foreground" : ""}`}
                >
                  {s.step}
                </div>
                <span
                  className={`text-[10px] font-medium text-center leading-tight
                    ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <div className="hidden" />}
              </div>
            );
          })}
        </div>
        {/* Connector line */}
        <div className="flex items-center gap-0 mt-2 px-3">
          <div className="flex-1 h-px bg-primary/60" />
          <div className="flex-1 h-px bg-white/15" />
        </div>
      </motion.div>

      {/* Upload Mode Selector */}
      <div className="w-full max-w-md mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setInputMode("capture")}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-smooth ${
            inputMode === "capture"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white/5 text-muted-foreground border-white/15"
          }`}
        >
          Capture
        </button>
        <button
          type="button"
          onClick={() => setInputMode("upload")}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-smooth ${
            inputMode === "upload"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white/5 text-muted-foreground border-white/15"
          }`}
        >
          Upload Image
        </button>
      </div>

      {/* ── Guidance tip ──────────────────────────────────────────────────── */}
      <div className="w-full max-w-md mb-3 h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip.id}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium ${guidanceBadgeClasses}`}
          >
            <TipIcon className="w-4 h-4" />
            {displayedTip}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Camera viewport ───────────────────────────────────────────────── */}
      <div
        className={`w-full max-w-md relative ${
          inputMode === "capture" ? "block" : "hidden"
        }`}
      >
        <div
          data-ocid="camera-viewport"
          className="relative rounded-2xl overflow-hidden border border-white/15"
          style={{ aspectRatio: "9/16", maxHeight: "56vh" }}
        >
          {/* Video stream or fallback */}
          {!cameraError ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-3"
              style={{ background: uploadPanelBackground }}
            >
              <CameraIcon className="w-10 h-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Camera unavailable
              </p>
              <p className="text-muted-foreground text-xs opacity-70">
                Using simulation mode
              </p>
            </div>
          )}

          {/* Dark overlay for better visibility of UI elements */}
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                className="text-primary text-sm font-medium"
              >
                Starting camera…
              </motion.div>
            </div>
          )}

          {/* Body silhouette SVG overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              viewBox="0 0 100 220"
              className="h-4/5 w-auto opacity-30"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.5"
              role="img"
              aria-label="Body silhouette guide"
            >
              {/* Head */}
              <ellipse cx="50" cy="22" rx="14" ry="16" />
              {/* Neck */}
              <line x1="44" y1="36" x2="42" y2="48" />
              <line x1="56" y1="36" x2="58" y2="48" />
              {/* Shoulders */}
              <path d="M42 48 Q28 52 22 65" />
              <path d="M58 48 Q72 52 78 65" />
              {/* Arms */}
              <path d="M22 65 Q18 85 20 105" />
              <path d="M78 65 Q82 85 80 105" />
              {/* Forearms */}
              <path d="M20 105 Q18 120 22 132" />
              <path d="M80 105 Q82 120 78 132" />
              {/* Hands */}
              <ellipse cx="21" cy="136" rx="5" ry="7" />
              <ellipse cx="79" cy="136" rx="5" ry="7" />
              {/* Torso */}
              <path d="M42 48 Q38 80 40 115" />
              <path d="M58 48 Q62 80 60 115" />
              <path d="M40 115 Q44 120 50 121" />
              <path d="M60 115 Q56 120 50 121" />
              {/* Hips */}
              <path d="M40 115 Q30 125 32 140" />
              <path d="M60 115 Q70 125 68 140" />
              {/* Left leg */}
              <path d="M32 140 Q30 165 32 190" />
              <path d="M42 140 Q44 165 42 190" />
              {/* Right leg */}
              <path d="M68 140 Q70 165 68 190" />
              <path d="M58 140 Q56 165 58 190" />
              {/* Feet */}
              <path d="M32 190 Q28 200 22 200 Q18 200 18 198" />
              <path d="M42 190 Q44 200 50 200" />
              <path d="M68 190 Q72 200 78 200 Q82 200 82 198" />
              <path d="M58 190 Q56 200 50 200" />
            </svg>
          </div>

          {/* Corner brackets */}
          {(["tl", "tr", "bl", "br"] as const).map((corner) => (
            <div
              key={corner}
              className={`absolute w-6 h-6 border-primary/80 pointer-events-none
                ${corner === "tl" ? "top-3 left-3 border-t-2 border-l-2 rounded-tl-sm" : ""}
                ${corner === "tr" ? "top-3 right-3 border-t-2 border-r-2 rounded-tr-sm" : ""}
                ${corner === "bl" ? "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-sm" : ""}
                ${corner === "br" ? "bottom-3 right-3 border-b-2 border-r-2 rounded-br-sm" : ""}
              `}
            />
          ))}

          {/* Animated scan line */}
          <motion.div
            className="absolute left-0 right-0 h-0.5 pointer-events-none"
            style={scanLineStyle}
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            }}
          />

          {/* Live detection counters */}
          <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/15 bg-background/50 backdrop-blur-sm px-3 py-2">
            <div className="flex items-center justify-between text-[10px]">
              <span
                className={
                  bodyDetectedCount >= 33 ? "text-emerald-300" : "text-red-300"
                }
              >
                Body landmarks: {bodyDetectedCount}/33
              </span>
              <span
                className={
                  faceDetectedCount >= 468 ? "text-emerald-300" : "text-red-300"
                }
              >
                Face landmarks: {faceDetectedCount}/468
              </span>
            </div>
            {!canCapture && (
              <p className="mt-1 text-[10px] font-medium text-red-300">
                {capturePhase === "face"
                  ? `Capture locked: face close-up should reach at least ${FACE_LANDMARK_MIN_READY}/${FACE_LANDMARK_TARGET} landmarks.`
                  : capturePhase === "body"
                    ? `Capture locked: full body should reach at least ${BODY_LANDMARK_MIN_READY}/${BODY_LANDMARK_TARGET} landmarks.`
                    : "Capture locked: both phases already completed."}
              </p>
            )}
          </div>



          {/* Face blur badge */}
          <motion.div
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card border border-emerald-400/30"
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400">
              Face Protected
            </span>
          </motion.div>

          <div className="absolute top-11 left-3 rounded-full border border-white/20 bg-background/60 px-2.5 py-1 text-[10px] font-semibold text-white">
            {phaseLabel}
          </div>

          {/* Scanning overlay */}
          <AnimatePresence>
            {captureState === "scanning" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
              >
                {/* Progress ring */}
                <div className="relative w-20 h-20">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 80 80"
                    role="img"
                    aria-label="Scan progress ring"
                  >
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="5"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="oklch(0.72 0.18 176)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - scanProgress / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.05s linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-primary text-sm font-bold">
                      {Math.round(scanProgress)}%
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-foreground font-semibold text-base">
                    Analyzing…
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Scanning body proportions
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete overlay */}
          <AnimatePresence>
            {captureState === "complete" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-background/75 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <CheckCircle className="w-16 h-16 text-emerald-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-foreground font-bold text-lg">
                    Dual Capture Complete
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Face and full-body images captured
                  </p>
                </div>
                <motion.button
                  data-ocid="continue-to-details-btn"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goToForm}
                  disabled={
                    !sessionReady ||
                    capturePhase !== "complete" ||
                    !faceCaptureDataUrl ||
                    !bodyCaptureDataUrl
                  }
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm shadow-lg ${
                    sessionReady &&
                    capturePhase === "complete" &&
                    !!faceCaptureDataUrl &&
                    !!bodyCaptureDataUrl
                      ? "gradient-teal text-primary-foreground"
                      : "bg-white/10 text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {sessionReady &&
                  capturePhase === "complete" &&
                  faceCaptureDataUrl &&
                  bodyCaptureDataUrl
                    ? "Continue to Details →"
                    : "Finalizing Analysis..."}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Controls below camera ────────────────────────────────────────── */}
        <GlassCard
          variant="elevated"
          className="mt-4 p-4 flex flex-col items-center gap-4"
        >
          {/* Capture button */}
          <div className="flex flex-col items-center gap-2">
            <motion.button
              data-ocid="capture-btn"
              onClick={handleCapture}
              disabled={captureState !== "idle" || !canCapture}
              whileHover={{ scale: captureState === "idle" ? 1.06 : 1 }}
              whileTap={{ scale: captureState === "idle" ? 0.95 : 1 }}
              className="relative w-16 h-16 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Capture photo"
            >
              {/* Outer ring pulse */}
              {captureState === "idle" && (
                <motion.div
                  animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute inset-0 rounded-full border-2 border-primary"
                />
              )}
              <div
                className={`w-full h-full rounded-full flex items-center justify-center ${
                  canCapture
                    ? "gradient-teal glow-teal"
                    : "bg-red-500/80 border border-red-300/60"
                }`}
              >
                <CameraIcon className="w-7 h-7 text-primary-foreground" />
              </div>
            </motion.button>

            <span className="text-xs text-muted-foreground font-medium">
              <span className="block text-red-300 font-semibold mb-1">
                click here to capture image
              </span>
              {captureState === "idle" &&
                (capturePhase === "face"
                  ? canCapture
                    ? "Tap to capture face close-up"
                    : "Align face close-up to enable capture"
                  : capturePhase === "body"
                    ? canCapture
                      ? "Tap to capture full body"
                      : "Align full body to enable capture"
                    : "Capture complete")}
              {captureState === "scanning" && "Scanning…"}
              {captureState === "complete" && "Complete!"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="rounded-lg border border-white/15 bg-background/40 p-2">
              <p className="text-[10px] text-muted-foreground mb-1">Face Capture</p>
              {faceCaptureDataUrl ? (
                <img
                  src={faceCaptureDataUrl}
                  alt="Face capture"
                  className="w-full h-20 object-cover rounded-md"
                />
              ) : (
                <div
                  className="w-full h-20 rounded-md"
                  style={{
                    background: mutedPreviewBackground,
                    border: `1px solid ${uploadPanelBorder}`,
                  }}
                />
              )}
            </div>
            <div className="rounded-lg border border-white/15 bg-background/40 p-2">
              <p className="text-[10px] text-muted-foreground mb-1">Body Capture</p>
              {bodyCaptureDataUrl ? (
                <img
                  src={bodyCaptureDataUrl}
                  alt="Body capture"
                  className="w-full h-20 object-cover rounded-md"
                />
              ) : (
                <div
                  className="w-full h-20 rounded-md"
                  style={{
                    background: mutedPreviewBackground,
                    border: `1px solid ${uploadPanelBorder}`,
                  }}
                />
              )}
            </div>
          </div>

          <p className="text-center text-xs font-medium text-muted-foreground">
            Continue stays locked until image analysis, face masking, and full
            landmark detection are complete.
          </p>
        </GlassCard>
      </div>

      {inputMode === "upload" && (
        <GlassCard
          variant="elevated"
          className="w-full max-w-md p-4 flex flex-col items-center gap-4"
        >
          <div
            className="w-full rounded-xl p-4 text-center"
            style={{
              border: `1px solid ${uploadPanelBorder}`,
              background: uploadPanelBackground,
            }}
          >
            <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-sm font-semibold text-foreground">
              Upload Child Image
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Camera capture is locked while upload mode is selected.
            </p>
          </div>

          <label
            className={`w-full rounded-xl px-4 py-3 text-center text-sm font-semibold text-foreground/90 transition-smooth ${
              uploadAnalyzing ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
            style={{
              border: `1px solid ${uploadPanelBorder}`,
              background: uploadPanelBackground,
            }}
            onMouseEnter={(event) => {
              if (!uploadAnalyzing) {
                event.currentTarget.style.background = uploadPanelHoverBackground;
              }
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = uploadPanelBackground;
            }}
          >
            {uploadAnalyzing ? "Analyzing image..." : "Select Image From Device"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadChange}
              disabled={uploadAnalyzing}
            />
          </label>

          <div
            className="w-full rounded-xl px-3 py-2"
            style={{
              border: `1px solid ${uploadPanelBorder}`,
              background: uploadPanelBackground,
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={uploadBodyDetectedCount >= 33 ? "text-emerald-300" : "text-red-300"}>
                Body landmarks: {uploadBodyDetectedCount}/33
              </span>
              <span className={uploadFaceDetectedCount >= 468 ? "text-emerald-300" : "text-red-300"}>
                Face landmarks: {uploadFaceDetectedCount}/468
              </span>
            </div>
            <p className={`mt-1 text-[11px] font-semibold ${uploadLandmarksComplete ? "text-emerald-300" : "text-red-300"}`}>
              {uploadLandmarksComplete
                ? "All required landmarks detected."
                : "All landmarks not detected. Please upload another image."}
            </p>
            {uploadAnalyzing && (
              <p className="mt-1 text-[11px] font-medium text-yellow-300">
                Analyzing landmarks, please wait...
              </p>
            )}
          </div>

          {uploadPreviewUrl && (
            <div
              className="w-full rounded-xl p-2"
              style={{
                border: `1px solid ${uploadPanelBorder}`,
                background: uploadPanelBackground,
              }}
            >
              <img
                src={uploadPreviewUrl}
                alt="Uploaded preview"
                className="w-full h-56 object-contain rounded-lg bg-black/10"
              />
            </div>
          )}

          {uploadConfirmMsg && (
            <p
              className={`w-full rounded-lg px-3 py-2 text-xs font-semibold text-center ${
                uploadConfirmIsError
                  ? "border border-red-400/40 bg-red-400/10 text-red-300"
                  : "border border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {uploadConfirmMsg}
            </p>
          )}

          <button
            type="button"
            onClick={goToForm}
            disabled={!uploadLandmarksComplete || !sessionReady || uploadAnalyzing}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${
              uploadLandmarksComplete && sessionReady && !uploadAnalyzing
                ? "gradient-teal text-primary-foreground"
                : "border border-white/15 bg-white/5 text-muted-foreground cursor-not-allowed"
            }`}
          >
            {uploadLandmarksComplete && sessionReady ? "Continue" : "Continue Locked"}
          </button>
        </GlassCard>
      )}
    </div>
  );
}



