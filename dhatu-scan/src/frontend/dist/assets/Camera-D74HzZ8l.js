import { c as createLucideIcon, u as useNavigate, r as reactExports, j as jsxRuntimeExports, m as motion, A as AnimatePresence } from "./index-CgOSgeFQ.js";
import { G as GlassCard } from "./GlassCard-CyzsPCNP.js";
import { E as Eye } from "./eye-DtpuVE8g.js";
import { L as Lock } from "./lock-CeR0i-PO.js";
import { C as CircleCheckBig } from "./circle-check-big-GluNNnkl.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$5 = [
  ["path", { d: "M17 12H7", key: "16if0g" }],
  ["path", { d: "M19 18H5", key: "18s9l3" }],
  ["path", { d: "M21 6H3", key: "1jwq7v" }]
];
const AlignCenter = createLucideIcon("align-center", __iconNode$5);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$4 = [
  [
    "path",
    {
      d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
      key: "1tc9qg"
    }
  ],
  ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }]
];
const Camera$1 = createLucideIcon("camera", __iconNode$4);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$3 = [
  [
    "path",
    {
      d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
      key: "1gvzjb"
    }
  ],
  ["path", { d: "M9 18h6", key: "x1upvd" }],
  ["path", { d: "M10 22h4", key: "ceow96" }]
];
const Lightbulb = createLucideIcon("lightbulb", __iconNode$3);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "m21 3-7 7", key: "1l2asr" }],
  ["path", { d: "m3 21 7-7", key: "tjx5ai" }],
  ["path", { d: "M9 21H3v-6", key: "wtvkvv" }]
];
const Maximize2 = createLucideIcon("maximize-2", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M6 8L2 12L6 16", key: "kyvwex" }],
  ["path", { d: "M2 12H22", key: "1m8cig" }]
];
const MoveLeft = createLucideIcon("move-left", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["polygon", { points: "5 4 15 12 5 20 5 4", key: "16p6eg" }],
  ["line", { x1: "19", x2: "19", y1: "5", y2: "19", key: "futhcm" }]
];
const SkipForward = createLucideIcon("skip-forward", __iconNode);
const TIPS = [
  {
    id: 0,
    label: "Stand 2m from camera",
    icon: Maximize2,
    color: "text-amber-400",
    bg: "bg-amber-400/15 border-amber-400/30"
  },
  {
    id: 1,
    label: "Move left slightly",
    icon: MoveLeft,
    color: "text-orange-400",
    bg: "bg-orange-400/15 border-orange-400/30"
  },
  {
    id: 2,
    label: "Stand straight",
    icon: AlignCenter,
    color: "text-emerald-400",
    bg: "bg-emerald-400/15 border-emerald-400/30"
  },
  {
    id: 3,
    label: "Good lighting needed",
    icon: Lightbulb,
    color: "text-yellow-400",
    bg: "bg-yellow-400/15 border-yellow-400/30"
  },
  {
    id: 4,
    label: "Full body must be visible",
    icon: Eye,
    color: "text-primary",
    bg: "bg-primary/15 border-primary/30"
  }
];
const STEPS = [
  { label: "Camera Analysis", step: 1 },
  { label: "Child Details", step: 2 },
  { label: "Results", step: 3 }
];
function Camera() {
  const navigate = useNavigate();
  const videoRef = reactExports.useRef(null);
  const streamRef = reactExports.useRef(null);
  const [cameraReady, setCameraReady] = reactExports.useState(false);
  const [cameraError, setCameraError] = reactExports.useState(false);
  const [tipIndex, setTipIndex] = reactExports.useState(0);
  const [confidence, setConfidence] = reactExports.useState(72);
  const [captureState, setCaptureState] = reactExports.useState("idle");
  const [scanProgress, setScanProgress] = reactExports.useState(0);
  reactExports.useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", aspectRatio: { ideal: 9 / 16 } },
          audio: false
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
  reactExports.useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
      setConfidence(65 + Math.floor(Math.random() * 30));
    }, 2e3);
    return () => clearInterval(id);
  }, []);
  const handleCapture = reactExports.useCallback(() => {
    if (captureState !== "idle") return;
    setCaptureState("scanning");
    setScanProgress(0);
    const start = Date.now();
    const duration = 3e3;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / duration * 100, 100);
      setScanProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        setCaptureState("complete");
      }
    };
    requestAnimationFrame(tick);
  }, [captureState]);
  const goToForm = reactExports.useCallback(() => {
    navigate({ to: "/form" });
  }, [navigate]);
  const currentTip = TIPS[tipIndex];
  const TipIcon = currentTip.icon;
  const isHighConfidence = confidence >= 80;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "camera-page",
      className: "min-h-screen bg-background flex flex-col items-center pt-4 pb-24 px-4",
      style: {
        background: "radial-gradient(ellipse at 50% 0%, oklch(0.12 0.025 250) 0%, oklch(0.09 0.015 250) 100%)"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            className: "w-full max-w-md mb-4",
            initial: { opacity: 0, y: -12 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.4 },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-2", children: STEPS.map((s, i) => {
                const active = s.step === 1;
                const done = s.step < 1;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: "flex-1 flex flex-col items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-smooth
                    ${active ? "bg-primary border-primary text-primary-foreground" : ""}
                    ${done ? "bg-primary/60 border-primary/40 text-primary-foreground" : ""}
                    ${!active && !done ? "border-white/20 text-muted-foreground" : ""}`,
                          children: s.step
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: `text-[10px] font-medium text-center leading-tight
                    ${active ? "text-primary" : "text-muted-foreground"}`,
                          children: s.label
                        }
                      ),
                      i < STEPS.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden" })
                    ]
                  },
                  s.step
                );
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0 mt-2 px-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-primary/60" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-white/15" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-md mb-3 h-10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: -8, scale: 0.95 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 8, scale: 0.95 },
            transition: { duration: 0.3 },
            className: `inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium ${currentTip.bg} ${currentTip.color}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TipIcon, { className: "w-4 h-4" }),
              currentTip.label
            ]
          },
          currentTip.id
        ) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "camera-viewport",
              className: "relative rounded-2xl overflow-hidden border border-white/15",
              style: { aspectRatio: "9/16", maxHeight: "56vh" },
              children: [
                !cameraError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "video",
                  {
                    ref: videoRef,
                    className: "w-full h-full object-cover",
                    autoPlay: true,
                    muted: true,
                    playsInline: true
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Camera$1, { className: "w-10 h-10 text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Camera unavailable" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs opacity-70", children: "Using simulation mode" })
                ] }),
                !cameraReady && !cameraError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-background/60 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  motion.div,
                  {
                    animate: { opacity: [0.4, 1, 0.4] },
                    transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY },
                    className: "text-primary text-sm font-medium",
                    children: "Starting camera…"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "svg",
                  {
                    viewBox: "0 0 100 220",
                    className: "h-4/5 w-auto opacity-30",
                    fill: "none",
                    stroke: "rgba(255,255,255,0.7)",
                    strokeWidth: "1.5",
                    role: "img",
                    "aria-label": "Body silhouette guide",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: "50", cy: "22", rx: "14", ry: "16" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "44", y1: "36", x2: "42", y2: "48" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "56", y1: "36", x2: "58", y2: "48" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M42 48 Q28 52 22 65" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M58 48 Q72 52 78 65" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M22 65 Q18 85 20 105" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M78 65 Q82 85 80 105" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 105 Q18 120 22 132" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M80 105 Q82 120 78 132" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: "21", cy: "136", rx: "5", ry: "7" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx: "79", cy: "136", rx: "5", ry: "7" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M42 48 Q38 80 40 115" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M58 48 Q62 80 60 115" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M40 115 Q44 120 50 121" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M60 115 Q56 120 50 121" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M40 115 Q30 125 32 140" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M60 115 Q70 125 68 140" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M32 140 Q30 165 32 190" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M42 140 Q44 165 42 190" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M68 140 Q70 165 68 190" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M58 140 Q56 165 58 190" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M32 190 Q28 200 22 200 Q18 200 18 198" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M42 190 Q44 200 50 200" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M68 190 Q72 200 78 200 Q82 200 82 198" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M58 190 Q56 200 50 200" })
                    ]
                  }
                ) }),
                ["tl", "tr", "bl", "br"].map((corner) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `absolute w-6 h-6 border-primary/80 pointer-events-none
                ${corner === "tl" ? "top-3 left-3 border-t-2 border-l-2 rounded-tl-sm" : ""}
                ${corner === "tr" ? "top-3 right-3 border-t-2 border-r-2 rounded-tr-sm" : ""}
                ${corner === "bl" ? "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-sm" : ""}
                ${corner === "br" ? "bottom-3 right-3 border-b-2 border-r-2 rounded-br-sm" : ""}
              `
                  },
                  corner
                )),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  motion.div,
                  {
                    className: "absolute left-0 right-0 h-0.5 pointer-events-none",
                    style: {
                      background: "linear-gradient(90deg, transparent 0%, oklch(0.72 0.18 176 / 0.8) 50%, transparent 100%)",
                      boxShadow: "0 0 8px oklch(0.72 0.18 176 / 0.6)"
                    },
                    animate: { top: ["10%", "90%", "10%"] },
                    transition: {
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop"
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-3 right-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card border border-white/15", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    motion.div,
                    {
                      animate: { scale: [1, 1.3, 1] },
                      transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY },
                      className: `w-1.5 h-1.5 rounded-full ${isHighConfidence ? "bg-primary" : "bg-yellow-400"}`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "span",
                    {
                      className: `text-[10px] font-semibold ${isHighConfidence ? "text-primary" : "text-yellow-400"}`,
                      children: [
                        "AI ",
                        confidence,
                        "%"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  motion.div,
                  {
                    animate: { opacity: [0.8, 1, 0.8] },
                    transition: { duration: 2.5, repeat: Number.POSITIVE_INFINITY },
                    className: "absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card border border-emerald-400/30",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-3 h-3 text-emerald-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold text-emerald-400", children: "Face Protected" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: captureState === "scanning" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  motion.div,
                  {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                    className: "absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-20 h-20", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "svg",
                          {
                            className: "w-full h-full -rotate-90",
                            viewBox: "0 0 80 80",
                            role: "img",
                            "aria-label": "Scan progress ring",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "circle",
                                {
                                  cx: "40",
                                  cy: "40",
                                  r: "34",
                                  fill: "none",
                                  stroke: "rgba(255,255,255,0.1)",
                                  strokeWidth: "5"
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "circle",
                                {
                                  cx: "40",
                                  cy: "40",
                                  r: "34",
                                  fill: "none",
                                  stroke: "oklch(0.72 0.18 176)",
                                  strokeWidth: "5",
                                  strokeLinecap: "round",
                                  strokeDasharray: `${2 * Math.PI * 34}`,
                                  strokeDashoffset: `${2 * Math.PI * 34 * (1 - scanProgress / 100)}`,
                                  style: { transition: "stroke-dashoffset 0.05s linear" }
                                }
                              )
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary text-sm font-bold", children: [
                          Math.round(scanProgress),
                          "%"
                        ] }) })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold text-base", children: "Analyzing…" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-1", children: "AI scanning body proportions" })
                      ] })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: captureState === "complete" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  motion.div,
                  {
                    initial: { opacity: 0, scale: 0.9 },
                    animate: { opacity: 1, scale: 1 },
                    className: "absolute inset-0 bg-background/75 backdrop-blur-sm flex flex-col items-center justify-center gap-4",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        motion.div,
                        {
                          initial: { scale: 0 },
                          animate: { scale: 1 },
                          transition: { type: "spring", stiffness: 260, damping: 18 },
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "w-16 h-16 text-emerald-400" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-bold text-lg", children: "Capture Complete" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "Wasting score: 78% confidence" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        motion.button,
                        {
                          "data-ocid": "continue-to-details-btn",
                          whileHover: { scale: 1.04 },
                          whileTap: { scale: 0.97 },
                          onClick: goToForm,
                          className: "px-6 py-2.5 rounded-full gradient-teal text-primary-foreground font-semibold text-sm shadow-lg",
                          children: "Continue to Details →"
                        }
                      )
                    ]
                  }
                ) })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            GlassCard,
            {
              variant: "elevated",
              className: "mt-4 p-4 flex flex-col items-center gap-4",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    motion.button,
                    {
                      "data-ocid": "capture-btn",
                      onClick: handleCapture,
                      disabled: captureState !== "idle",
                      whileHover: { scale: captureState === "idle" ? 1.06 : 1 },
                      whileTap: { scale: captureState === "idle" ? 0.95 : 1 },
                      className: "relative w-16 h-16 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      "aria-label": "Capture photo",
                      children: [
                        captureState === "idle" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                          motion.div,
                          {
                            animate: { scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] },
                            transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
                            className: "absolute inset-0 rounded-full border-2 border-primary"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full rounded-full gradient-teal flex items-center justify-center glow-teal", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera$1, { className: "w-7 h-7 text-primary-foreground" }) })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground font-medium", children: [
                    captureState === "idle" && "Tap to capture",
                    captureState === "scanning" && "Scanning…",
                    captureState === "complete" && "Complete!"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    "data-ocid": "skip-camera-btn",
                    onClick: goToForm,
                    className: "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-smooth focus-visible:outline-none focus-visible:underline",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SkipForward, { className: "w-3.5 h-3.5" }),
                      "Skip Camera / Enter Details Manually"
                    ]
                  }
                )
              ]
            }
          )
        ] })
      ]
    }
  );
}
export {
  Camera as default
};
