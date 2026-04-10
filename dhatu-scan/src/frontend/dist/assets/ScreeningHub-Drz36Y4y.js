import { j as jsxRuntimeExports, L as Link } from "./index-BzFT_KhA.js";
import { G as GlassCard } from "./GlassCard-BSN70r43.js";
const STEPS = [
  {
    title: "Camera Screening",
    desc: "Use the phone camera workflow for the visual scan step.",
    to: "/camera",
    cta: "Open Camera"
  },
  {
    title: "Child Details",
    desc: "Enter age, height, weight, diet, and household details.",
    to: "/form",
    cta: "Open Form"
  },
  {
    title: "See Results",
    desc: "Move directly to results after a completed screening session.",
    to: "/results",
    cta: "Open Results"
  }
];
function ScreeningHub() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-8 sm:px-6 lg:px-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "elevated", className: "p-8 rounded-[2rem]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm uppercase tracking-[0.24em] text-primary", children: "Screening" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-4xl font-bold text-foreground", children: "Run the screening flow in a cleaner way." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-3xl text-base leading-7 text-foreground/66", children: "This section groups the scan experience so the sidebar stays simple. Start from camera, complete the child details, and then review the generated results and statistics." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 grid gap-5 md:grid-cols-3", children: STEPS.map((step, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "elevated", className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-2xl gradient-teal text-sm font-bold text-primary-foreground shadow-glow-teal", children: index + 1 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-5 font-display text-2xl font-semibold text-foreground", children: step.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm leading-6 text-foreground/62", children: step.desc }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: step.to,
          className: "mt-6 inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-smooth hover:bg-primary/15",
          children: step.cta
        }
      )
    ] }, step.title)) })
  ] }) });
}
export {
  ScreeningHub as default
};
