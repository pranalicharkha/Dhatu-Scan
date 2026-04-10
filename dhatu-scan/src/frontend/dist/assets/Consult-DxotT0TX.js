import { j as jsxRuntimeExports } from "./index-BzFT_KhA.js";
import { G as GlassCard } from "./GlassCard-BSN70r43.js";
const CONSULT_OPTIONS = [
  {
    title: "Book a Pediatrician",
    desc: "Prepare symptoms, screening results, and growth history before visiting a doctor."
  },
  {
    title: "Nutrition Specialist",
    desc: "Get feeding plans, diet advice, and household nutrition support recommendations."
  },
  {
    title: "NGO / Community Worker",
    desc: "Find practical support for supplements, local screening camps, and follow-up visits."
  }
];
const CHECKLIST = [
  "Carry the latest result summary and child growth data.",
  "Note changes in appetite, weight, fever, or weakness.",
  "Discuss safe water, feeding diversity, and next follow-up date."
];
function Consult() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-8 sm:px-6 lg:px-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "elevated", className: "p-8 rounded-[2rem]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm uppercase tracking-[0.24em] text-primary", children: "Consult" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-4xl font-bold text-foreground", children: "Go to a doctor and plan the next care step." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-3xl text-base leading-7 text-foreground/66", children: "This section is for professional follow-up. Use it when you want to move from screening into real-world medical advice, nutrition care, or community support." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-5 md:grid-cols-3", children: CONSULT_OPTIONS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "elevated", className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-semibold text-foreground", children: item.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm leading-6 text-foreground/62", children: item.desc }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "mt-6 rounded-full gradient-teal px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-teal",
          children: "Open Support Path"
        }
      )
    ] }, item.title)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "elevated", className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.22em] text-foreground/45", children: "Before You Visit" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 grid gap-3", children: CHECKLIST.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground/68",
          children: item
        },
        item
      )) })
    ] })
  ] }) });
}
export {
  Consult as default
};
