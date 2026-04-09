import { r as resolveElements, a as reactExports, j as jsxRuntimeExports, m as motion, L as Link } from "./index-C9zBq3XQ.js";
import { G as GlassCard } from "./GlassCard-DVz87344.js";
const thresholds = {
  some: 0,
  all: 1
};
function inView(elementOrSelector, onStart, { root, margin: rootMargin, amount = "some" } = {}) {
  const elements = resolveElements(elementOrSelector);
  const activeIntersections = /* @__PURE__ */ new WeakMap();
  const onIntersectionChange = (entries) => {
    entries.forEach((entry) => {
      const onEnd = activeIntersections.get(entry.target);
      if (entry.isIntersecting === Boolean(onEnd))
        return;
      if (entry.isIntersecting) {
        const newOnEnd = onStart(entry.target, entry);
        if (typeof newOnEnd === "function") {
          activeIntersections.set(entry.target, newOnEnd);
        } else {
          observer.unobserve(entry.target);
        }
      } else if (typeof onEnd === "function") {
        onEnd(entry);
        activeIntersections.delete(entry.target);
      }
    });
  };
  const observer = new IntersectionObserver(onIntersectionChange, {
    root,
    rootMargin,
    threshold: typeof amount === "number" ? amount : thresholds[amount]
  });
  elements.forEach((element) => observer.observe(element));
  return () => observer.disconnect();
}
function useInView(ref, { root, margin, amount, once = false, initial = false } = {}) {
  const [isInView, setInView] = reactExports.useState(initial);
  reactExports.useEffect(() => {
    if (!ref.current || once && isInView)
      return;
    const onEnter = () => {
      setInView(true);
      return once ? void 0 : () => setInView(false);
    };
    const options = {
      root: root && root.current || void 0,
      margin,
      amount
    };
    return inView(ref.current, onEnter, options);
  }, [root, ref, margin, once, amount]);
  return isInView;
}
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay }
  })
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay }
  })
};
function Section({
  children,
  className = "",
  id,
  style
}) {
  const ref = reactExports.useRef(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id, ref, className, style, children });
}
function AnimatedStat({
  value,
  label,
  icon,
  delay
}) {
  const ref = reactExports.useRef(null);
  const inView2 = useInView(ref, { once: true });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      ref,
      custom: delay,
      variants: fadeUp,
      initial: "hidden",
      animate: inView2 ? "visible" : "hidden",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        GlassCard,
        {
          variant: "elevated",
          hover: true,
          className: "p-6 text-center flex flex-col items-center gap-3",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl", role: "img", "aria-hidden": "true", children: icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-display font-bold text-gradient-teal", children: value }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-foreground/60 font-medium", children: label })
          ]
        }
      )
    }
  );
}
function StepCard({
  step,
  title,
  desc,
  icon,
  delay
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    GlassCard,
    {
      animate: true,
      delay,
      hover: true,
      variant: "elevated",
      className: "p-6 flex flex-col gap-4 relative",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full gradient-teal flex items-center justify-center text-white font-bold text-sm shrink-0 glow-teal", children: step }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: icon })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-semibold text-foreground mb-1", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground/60 leading-relaxed", children: desc })
        ] })
      ]
    }
  );
}
const FEATURES = [
  {
    icon: "📸",
    title: "Camera AI Analysis",
    desc: "Real-time pose detection and body proportion analysis using your smartphone camera — no special equipment needed.",
    glow: "teal"
  },
  {
    icon: "📊",
    title: "WHO Growth Standards",
    desc: "Validated Z-score calculations based on WHO child growth standards for height, weight, and age.",
    glow: "blue"
  },
  {
    icon: "📶",
    title: "Offline-First",
    desc: "Full functionality without internet. All processing happens on your device — no cloud required.",
    glow: "green"
  },
  {
    icon: "🔒",
    title: "Privacy Shield",
    desc: "On-device AI, automatic face masking, zero cloud uploads. Your child's data never leaves your device.",
    glow: "none"
  },
  {
    icon: "📈",
    title: "Growth Tracking",
    desc: "Longitudinal charts tracking height, weight, and Z-score trends over time with improvement insights.",
    glow: "teal"
  },
  {
    icon: "🎮",
    title: "Kid Gamification",
    desc: "Fun rewards system with XP, badges, and level progression — from Healthy Seed to Strong Tree.",
    glow: "green"
  }
];
const PROBLEMS = [
  {
    icon: "😰",
    title: "Silent Crisis",
    desc: "Malnutrition often shows no obvious symptoms until it becomes severe, making early detection critical."
  },
  {
    icon: "🏥",
    title: "Limited Access",
    desc: "Billions of people lack access to healthcare facilities equipped for nutritional assessment."
  },
  {
    icon: "⏱️",
    title: "Late Diagnosis",
    desc: "By the time malnutrition is clinically diagnosed, irreversible developmental damage may already have occurred."
  }
];
const TESTIMONIALS = [
  {
    initials: "SP",
    name: "Sunita Patel",
    role: "Parent",
    location: "Rajasthan",
    quote: "Dhatu-Scan helped me track my daughter's growth at home. The clear risk scores gave me confidence to seek timely medical advice.",
    color: "from-teal-500 to-cyan-400"
  },
  {
    initials: "DR",
    name: "Dr. Rohan Mehta",
    role: "Pediatrician",
    location: "Mumbai",
    quote: "An impressive tool for community health workers. The WHO Z-score integration and dietary scoring make it clinically meaningful.",
    color: "from-blue-500 to-violet-400"
  },
  {
    initials: "AM",
    name: "Ananya Mishra",
    role: "NGO Field Worker",
    location: "Odisha",
    quote: "We use Dhatu-Scan in villages with no internet. Offline-first design is a game changer for rural child health programs.",
    color: "from-emerald-500 to-teal-400"
  }
];
function HeroVisualization() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full max-w-sm mx-auto aspect-square flex items-center justify-center", children: [
    [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "absolute rounded-full border border-teal-500/20",
        style: {
          width: `${60 + i * 20}%`,
          height: `${60 + i * 20}%`
        },
        animate: { scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] },
        transition: {
          duration: 2.5 + i * 0.5,
          repeat: Number.POSITIVE_INFINITY,
          delay: i * 0.4
        }
      },
      i
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "absolute rounded-full",
        style: {
          width: "70%",
          height: "70%",
          background: "conic-gradient(from 0deg, transparent 270deg, oklch(0.72 0.18 176 / 0.6) 360deg)"
        },
        animate: { rotate: 360 },
        transition: {
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear"
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "relative z-10 rounded-full overflow-hidden flex items-center justify-center",
        style: {
          width: "58%",
          height: "58%",
          background: "radial-gradient(circle, oklch(0.15 0.02 250) 0%, oklch(0.09 0.015 250) 100%)",
          border: "1px solid oklch(0.72 0.18 176 / 0.3)",
          boxShadow: "0 0 40px oklch(0.72 0.18 176 / 0.25)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: "/assets/generated/hero-health-scan.dim_800x800.png",
              alt: "AI Health Scan Visualization",
              className: "w-full h-full object-cover opacity-80"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              className: "absolute inset-0",
              style: {
                background: "linear-gradient(0deg, transparent 0%, oklch(0.72 0.18 176 / 0.15) 50%, transparent 100%)",
                backgroundSize: "100% 30px"
              },
              animate: { backgroundPositionY: ["0%", "100%"] },
              transition: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear"
              }
            }
          )
        ]
      }
    ),
    [
      { label: "Height ✓", pos: { top: "8%", right: "5%" }, delay: 0 },
      {
        label: "BMI: Normal",
        pos: { bottom: "12%", left: "2%" },
        delay: 0.5
      },
      {
        label: "Z-Score: −0.4",
        pos: { bottom: "5%", right: "8%" },
        delay: 1
      }
    ].map(({ label, pos, delay }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "absolute text-xs font-mono px-2 py-1 rounded-md",
        style: {
          ...pos,
          background: "oklch(0.13 0.018 250 / 0.9)",
          border: "1px solid oklch(0.72 0.18 176 / 0.4)",
          color: "oklch(0.82 0.18 176)"
        },
        animate: { opacity: [0.6, 1, 0.6], y: [-2, 2, -2] },
        transition: {
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          delay
        },
        children: label
      },
      label
    ))
  ] });
}
function Landing() {
  const heroRef = reactExports.useRef(null);
  const scrollToSection = (id) => {
    var _a;
    (_a = document.getElementById(id)) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-h-screen overflow-x-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        ref: heroRef,
        className: "relative min-h-screen flex items-center gradient-hero pt-20 pb-16",
        "data-ocid": "hero-section",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "order-2 lg:order-1 text-center lg:text-left", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.div,
                {
                  custom: 0,
                  variants: fadeIn,
                  initial: "hidden",
                  animate: "visible",
                  className: "inline-flex items-center gap-2 mb-6",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase",
                      style: {
                        background: "oklch(0.72 0.18 176 / 0.15)",
                        border: "1px solid oklch(0.72 0.18 176 / 0.4)",
                        color: "oklch(0.82 0.18 176)"
                      },
                      children: "🏥 Healthcare AI · Hackathon 2026"
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.h1,
                {
                  custom: 0.1,
                  variants: fadeUp,
                  initial: "hidden",
                  animate: "visible",
                  className: "text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-none mb-4",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient-teal", children: "Dhatu-Scan" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.p,
                {
                  custom: 0.2,
                  variants: fadeUp,
                  initial: "hidden",
                  animate: "visible",
                  className: "text-xl sm:text-2xl font-display font-semibold text-foreground/80 mb-4",
                  children: "AI Powered Child Malnutrition Detection"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.p,
                {
                  custom: 0.3,
                  variants: fadeUp,
                  initial: "hidden",
                  animate: "visible",
                  className: "text-base text-foreground/55 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0",
                  children: "A privacy-first platform that helps parents, caregivers, and NGOs detect malnutrition early using smartphone camera analysis, WHO growth standards, and dietary risk assessment. No cloud. No data sharing. Just care."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  custom: 0.45,
                  variants: fadeUp,
                  initial: "hidden",
                  animate: "visible",
                  className: "flex flex-col sm:flex-row gap-4 justify-center lg:justify-start",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Link,
                      {
                        to: "/form",
                        "data-ocid": "cta-start-assessment",
                        className: "group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-smooth overflow-hidden",
                        style: {
                          background: "linear-gradient(135deg, oklch(0.72 0.18 176), oklch(0.65 0.17 210))",
                          boxShadow: "0 0 24px oklch(0.72 0.18 176 / 0.35)"
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative z-10", children: "🚀 Start Assessment" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            motion.div,
                            {
                              className: "absolute inset-0",
                              style: { background: "oklch(0.72 0.18 176 / 0.2)" },
                              initial: { x: "-100%" },
                              whileHover: { x: "0%" },
                              transition: { duration: 0.3 }
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Link,
                      {
                        to: "/camera",
                        "data-ocid": "cta-view-demo",
                        className: "inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-foreground/90 text-base transition-smooth",
                        style: {
                          border: "1px solid oklch(0.72 0.18 176 / 0.4)",
                          background: "oklch(0.72 0.18 176 / 0.08)"
                        },
                        children: "📷 View Demo"
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  custom: 0.55,
                  variants: fadeIn,
                  initial: "hidden",
                  animate: "visible",
                  className: "mt-8 flex items-center gap-4 justify-center lg:justify-start text-sm text-foreground/40",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "✅ 100% On-Device" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "·" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "✅ WHO Validated" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "·" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "✅ Works Offline" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.div,
              {
                initial: { opacity: 0, scale: 0.8 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.8, delay: 0.2 },
                className: "order-1 lg:order-2 flex justify-center",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeroVisualization, {})
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.button,
            {
              onClick: () => scrollToSection("stats"),
              "aria-label": "Scroll to stats",
              className: "absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-foreground/30 text-xs hover:text-foreground/60 transition-smooth",
              animate: { y: [0, 6, 0] },
              transition: { duration: 1.8, repeat: Number.POSITIVE_INFINITY },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Scroll" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    width: "16",
                    height: "16",
                    viewBox: "0 0 16 16",
                    fill: "currentColor",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 10.586L2.707 5.293 1.293 6.707 8 13.414l6.707-6.707-1.414-1.414z" })
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Section,
      {
        id: "stats",
        className: "py-16 relative",
        style: { background: "oklch(0.11 0.018 250 / 0.6)" },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            AnimatedStat,
            {
              value: "92%",
              label: "Simulated Accuracy",
              icon: "🎯",
              delay: 0
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            AnimatedStat,
            {
              value: "100%",
              label: "Offline Support",
              icon: "📶",
              delay: 0.1
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            AnimatedStat,
            {
              value: "WHO",
              label: "Growth Standards",
              icon: "🌍",
              delay: 0.2
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            AnimatedStat,
            {
              value: "0 KB",
              label: "Cloud Uploads",
              icon: "🔒",
              delay: 0.3
            }
          )
        ] }) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { id: "problem", className: "py-20 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          variants: fadeUp,
          initial: "hidden",
          whileInView: "visible",
          viewport: { once: true },
          className: "text-center mb-14",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3 block", children: "Why It Matters" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-3xl sm:text-4xl font-display font-bold text-foreground mb-4", children: [
              "The Challenge We",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient-teal", children: "Cannot Ignore" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground/55 max-w-2xl mx-auto text-base leading-relaxed", children: "149 million children under 5 suffer from stunting globally. Nearly 50 million are acutely malnourished. Yet most go undetected until it is too late." })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        GlassCard,
        {
          animate: true,
          variant: "elevated",
          className: "p-8 mb-10 text-center",
          style: {
            borderColor: "oklch(0.72 0.18 176 / 0.3)"
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              variants: fadeUp,
              initial: "hidden",
              whileInView: "visible",
              viewport: { once: true },
              className: "flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12",
              children: [
                { n: "149M", label: "children stunted globally" },
                { n: "49M", label: "children acutely wasted" },
                { n: "45%", label: "of child deaths linked to malnutrition" }
              ].map(({ n, label }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl font-display font-bold text-gradient-teal", children: n }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-foreground/50 mt-1", children: label })
              ] }, n))
            }
          )
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-3 gap-5", children: PROBLEMS.map(({ icon, title, desc }, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        GlassCard,
        {
          animate: true,
          delay: i * 0.12,
          hover: true,
          variant: "elevated",
          className: "p-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl mb-3", children: icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-semibold text-foreground mb-2", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground/55 leading-relaxed", children: desc })
          ]
        },
        title
      )) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Section,
      {
        id: "how-it-works",
        className: "py-20 relative",
        style: { background: "oklch(0.11 0.018 250 / 0.5)" },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              variants: fadeUp,
              initial: "hidden",
              whileInView: "visible",
              viewport: { once: true },
              className: "text-center mb-14",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3 block", children: "Simple 4-Step Process" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-3xl sm:text-4xl font-display font-bold text-foreground", children: [
                  "How ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient-teal", children: "Dhatu-Scan" }),
                  " Works"
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "absolute top-10 left-[12%] right-[12%] h-px hidden lg:block",
                style: {
                  background: "linear-gradient(90deg, transparent, oklch(0.72 0.18 176 / 0.3), oklch(0.72 0.18 176 / 0.3), transparent)"
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StepCard,
              {
                step: 1,
                icon: "📸",
                title: "Camera Analysis",
                desc: "Point your smartphone camera at the child. Our AI detects body proportions and pose landmarks in real time.",
                delay: 0
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StepCard,
              {
                step: 2,
                icon: "📝",
                title: "Child Details",
                desc: "Enter age, height, weight, dietary habits, and water source. Multi-step form with guided validation.",
                delay: 0.12
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StepCard,
              {
                step: 3,
                icon: "🧠",
                title: "AI Assessment",
                desc: "The engine fuses wasting scores with dietary risk using WHO Z-score simulation to compute a final risk level.",
                delay: 0.24
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StepCard,
              {
                step: 4,
                icon: "📋",
                title: "Results & Guidance",
                desc: "Receive color-coded risk level, WHO status, improvement recommendations, and shareable report.",
                delay: 0.36
              }
            )
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { id: "features", className: "py-20 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          variants: fadeUp,
          initial: "hidden",
          whileInView: "visible",
          viewport: { once: true },
          className: "text-center mb-14",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3 block", children: "Platform Capabilities" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-3xl sm:text-4xl font-display font-bold text-foreground", children: [
              "Everything You Need in",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient-health", children: "One App" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-5", children: FEATURES.map(({ icon, title, desc, glow }, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        GlassCard,
        {
          animate: true,
          delay: i * 0.08,
          hover: true,
          variant: "elevated",
          glow,
          className: "p-6 group",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl mb-4 group-hover:scale-110 transition-smooth inline-block", children: icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-semibold text-foreground mb-2", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground/55 leading-relaxed", children: desc })
          ]
        },
        title
      )) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Section,
      {
        id: "testimonials",
        className: "py-20 relative",
        style: { background: "oklch(0.11 0.018 250 / 0.5)" },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              variants: fadeUp,
              initial: "hidden",
              whileInView: "visible",
              viewport: { once: true },
              className: "text-center mb-14",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3 block", children: "Real Impact" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-3xl sm:text-4xl font-display font-bold text-foreground", children: [
                  "Trusted by ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gradient-teal", children: "Communities" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-3 gap-5", children: TESTIMONIALS.map(
            ({ initials, name, role, location, quote, color }, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              GlassCard,
              {
                animate: true,
                delay: i * 0.12,
                hover: true,
                variant: "elevated",
                className: "p-6 flex flex-col gap-4",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-foreground/70 leading-relaxed flex-1 italic", children: [
                    '"',
                    quote,
                    '"'
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 pt-2 border-t border-white/8", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: `w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`,
                        children: initials
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground text-sm truncate", children: name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-foreground/45 truncate", children: [
                        role,
                        " · ",
                        location
                      ] })
                    ] })
                  ] })
                ]
              },
              name
            )
          ) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Section, { className: "py-16 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      GlassCard,
      {
        animate: true,
        variant: "elevated",
        className: "p-10 text-center relative overflow-hidden",
        style: {
          borderColor: "oklch(0.72 0.18 176 / 0.25)"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "absolute inset-0 opacity-10 pointer-events-none",
              style: {
                background: "radial-gradient(ellipse at center, oklch(0.72 0.18 176) 0%, transparent 70%)"
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              variants: fadeUp,
              initial: "hidden",
              whileInView: "visible",
              viewport: { once: true },
              className: "relative z-10",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl mb-4", children: "🌱" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl sm:text-3xl font-display font-bold text-foreground mb-3", children: "Start Detecting Early. Start Saving Lives." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground/55 mb-8 max-w-lg mx-auto text-sm leading-relaxed", children: "Join thousands of parents and healthcare workers using Dhatu-Scan to protect children's futures — completely free, completely private." }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Link,
                    {
                      to: "/form",
                      "data-ocid": "cta-banner-start",
                      className: "inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-smooth",
                      style: {
                        background: "linear-gradient(135deg, oklch(0.72 0.18 176), oklch(0.65 0.17 210))",
                        boxShadow: "0 0 24px oklch(0.72 0.18 176 / 0.3)"
                      },
                      children: "🚀 Begin Free Assessment"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Link,
                    {
                      to: "/privacy",
                      "data-ocid": "cta-banner-privacy",
                      className: "inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-foreground/70 text-base transition-smooth",
                      style: { border: "1px solid oklch(0.72 0.18 176 / 0.25)" },
                      children: "🔒 Privacy Commitment"
                    }
                  )
                ] })
              ]
            }
          )
        ]
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "footer",
      {
        className: "py-12 border-t border-white/8 relative",
        style: { background: "oklch(0.09 0.015 250)" },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid sm:grid-cols-3 gap-8 mb-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: "🌱" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-bold text-xl text-gradient-teal", children: "Dhatu-Scan" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground/45 leading-relaxed", children: "AI-powered early malnutrition detection for every child, everywhere." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-foreground/70 text-sm mb-3 uppercase tracking-wider", children: "Quick Links" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: [
                { label: "Start Assessment", to: "/form" },
                { label: "Camera Analysis", to: "/camera" },
                { label: "Growth History", to: "/history" },
                { label: "Gamification", to: "/gamification" },
                { label: "Privacy", to: "/privacy" }
              ].map(({ label, to }) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Link,
                {
                  to,
                  className: "text-sm text-foreground/45 hover:text-foreground/80 transition-smooth",
                  children: label
                }
              ) }, to)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-foreground/70 text-sm mb-3 uppercase tracking-wider", children: "Privacy Commitment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1.5 text-sm text-foreground/45", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "🔒 All data stored locally" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "📵 Zero cloud uploads" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "🎭 Automatic face masking" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "🤖 On-device AI only" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "🗑️ Delete anytime" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "© ",
              (/* @__PURE__ */ new Date()).getFullYear(),
              " Dhatu-Scan. Built with love for children's health."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "hover:text-foreground/60 transition-smooth",
                children: "Built with caffeine.ai"
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
export {
  Landing as default
};
