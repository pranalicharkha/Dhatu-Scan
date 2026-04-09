import GlassCard from "@/components/GlassCard";
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
  SkipForward,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  { label: "Camera Analysis", step: 1 },
  { label: "Child Details", step: 2 },
  { label: "Results", step: 3 },
] as const;

type CaptureState = "idle" | "scanning" | "complete";

export default function Camera() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [confidence, setConfidence] = useState(72);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [scanProgress, setScanProgress] = useState(0);

  // ── Camera init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
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
  }, []);

  // ── Rotate tips ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
      setConfidence(65 + Math.floor(Math.random() * 30));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // ── Capture handler ─────────────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    if (captureState !== "idle") return;
    setCaptureState("scanning");
    setScanProgress(0);

    const start = Date.now();
    const duration = 3000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setScanProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        setCaptureState("complete");
      }
    };
    requestAnimationFrame(tick);
  }, [captureState]);

  const goToForm = useCallback(() => {
    navigate({ to: "/form" });
  }, [navigate]);

  const currentTip = TIPS[tipIndex];
  const TipIcon = currentTip.icon;
  const isHighConfidence = confidence >= 80;

  return (
    <div
      data-ocid="camera-page"
      className="min-h-screen bg-background flex flex-col items-center pt-4 pb-24 px-4"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, oklch(0.12 0.025 250) 0%, oklch(0.09 0.015 250) 100%)",
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

      {/* ── Guidance tip ──────────────────────────────────────────────────── */}
      <div className="w-full max-w-md mb-3 h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip.id}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium ${currentTip.bg} ${currentTip.color}`}
          >
            <TipIcon className="w-4 h-4" />
            {currentTip.label}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Camera viewport ───────────────────────────────────────────────── */}
      <div className="w-full max-w-md relative">
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
            <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-3">
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
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, oklch(0.72 0.18 176 / 0.8) 50%, transparent 100%)",
              boxShadow: "0 0 8px oklch(0.72 0.18 176 / 0.6)",
            }}
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            }}
          />

          {/* Confidence score badge */}
          <div className="absolute top-3 right-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card border border-white/15">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              className={`w-1.5 h-1.5 rounded-full ${isHighConfidence ? "bg-primary" : "bg-yellow-400"}`}
            />
            <span
              className={`text-[10px] font-semibold ${isHighConfidence ? "text-primary" : "text-yellow-400"}`}
            >
              AI {confidence}%
            </span>
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
                    AI scanning body proportions
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
                    Capture Complete
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Wasting score: 78% confidence
                  </p>
                </div>
                <motion.button
                  data-ocid="continue-to-details-btn"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goToForm}
                  className="px-6 py-2.5 rounded-full gradient-teal text-primary-foreground font-semibold text-sm shadow-lg"
                >
                  Continue to Details →
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
              disabled={captureState !== "idle"}
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
              <div className="w-full h-full rounded-full gradient-teal flex items-center justify-center glow-teal">
                <CameraIcon className="w-7 h-7 text-primary-foreground" />
              </div>
            </motion.button>

            <span className="text-xs text-muted-foreground font-medium">
              {captureState === "idle" && "Tap to capture"}
              {captureState === "scanning" && "Scanning…"}
              {captureState === "complete" && "Complete!"}
            </span>
          </div>

          {/* Skip option */}
          <button
            type="button"
            data-ocid="skip-camera-btn"
            onClick={goToForm}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-smooth focus-visible:outline-none focus-visible:underline"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip Camera / Enter Details Manually
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
