import { u as useNavigate, a as useApp, j as jsxRuntimeExports, L as Link, m as motion } from "./index-CgOSgeFQ.js";
const STEPS = [
  {
    title: "1. Screening",
    desc: "Capture body measurements and first visual screening for early malnutrition risk.",
    bg: "#f4ebdf",
    text: "#4f4567"
  },
  {
    title: "2. Data Adding",
    desc: "Add child age, diet, weight, height, and health details for a stronger assessment.",
    bg: "#b5d1da",
    text: "#314552"
  },
  {
    title: "3. ML Detect",
    desc: "The model analyzes the screening inputs to detect possible undernutrition patterns.",
    bg: "#b8a4cc",
    text: "#45385f"
  },
  {
    title: "4. Results",
    desc: "View the risk result, trends, and the next care action in one clear dashboard.",
    bg: "#9c8fcb",
    text: "#f8f3ed"
  }
];
const PALETTE = {
  panel: "#efe3d4",
  blue: "#b5d1da",
  lavender: "#b8a4cc",
  purple: "#9c8fcb",
  ink: "#403552",
  muted: "#6a5f79",
  white: "#fffaf5",
  buttonDark: "#52456d"
};
function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useApp();
  const enterApp = async () => {
    signIn();
    await navigate({ to: "/dashboard" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "min-h-screen",
      style: {
        background: "linear-gradient(180deg, #f4ebdf 0%, #f4ebdf 34%, #b5d1da 34%, #b5d1da 58%, #b8a4cc 58%, #b8a4cc 79%, #9c8fcb 79%, #9c8fcb 100%)"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "px-4 py-6 sm:px-6 lg:px-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold",
                style: { backgroundColor: PALETTE.purple, color: PALETTE.white },
                children: "DS"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "font-display text-xl font-bold",
                  style: { color: PALETTE.ink },
                  children: "Dhatu-Scan"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", style: { color: PALETTE.muted }, children: "Early malnutrition detection support" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: enterApp,
                className: "rounded-full px-5 py-2 text-sm font-semibold transition-smooth",
                style: {
                  backgroundColor: PALETTE.white,
                  color: PALETTE.ink,
                  border: `1px solid ${PALETTE.lavender}`
                },
                children: "Login"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: enterApp,
                className: "rounded-full px-5 py-2 text-sm font-semibold transition-smooth",
                style: {
                  backgroundColor: PALETTE.buttonDark,
                  color: PALETTE.white
                },
                children: "Sign Up"
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "px-4 pb-12 pt-4 sm:px-6 lg:px-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "pt-4 lg:pt-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.span,
              {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                className: "inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em]",
                style: {
                  backgroundColor: PALETTE.white,
                  color: PALETTE.ink,
                  border: `1px solid ${PALETTE.lavender}`
                },
                children: "Child Nutrition Screening Platform"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.h1,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.08 },
                className: "mt-6 max-w-4xl font-display text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl",
                style: { color: PALETTE.ink },
                children: [
                  "Detect malnutrition early,",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block", style: { color: "#5f5282" }, children: "guide families faster," }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block", style: { color: "#ffffff" }, children: "and act with confidence." })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.p,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.14 },
                className: "mt-6 max-w-2xl text-lg leading-8",
                style: { color: "#4d4561" },
                children: "Dhatu-Scan supports caregivers and health workers with a clear workflow for screening, data entry, ML-based risk detection, and easy-to-read results for child nutrition care."
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-10 grid max-w-3xl gap-4 sm:grid-cols-2", children: STEPS.map((step, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              motion.div,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.2 + index * 0.06 },
                className: "rounded-[1.75rem] p-5 shadow-sm",
                style: { backgroundColor: step.bg, color: step.text },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-xl font-semibold", children: step.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-6", children: step.desc })
                ]
              },
              step.title
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.section,
            {
              initial: { opacity: 0, scale: 0.97 },
              animate: { opacity: 1, scale: 1 },
              transition: { delay: 0.16 },
              className: "lg:pt-6",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "rounded-[2rem] p-8 shadow-xl",
                  style: { backgroundColor: PALETTE.panel, color: PALETTE.ink },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "p",
                          {
                            className: "text-sm uppercase tracking-[0.22em]",
                            style: { color: PALETTE.muted },
                            children: "Welcome Back"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-2 font-display text-3xl font-semibold", children: "Sign in to continue care tracking" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold",
                          style: { backgroundColor: PALETTE.blue, color: PALETTE.ink },
                          children: "+"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 space-y-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "label",
                          {
                            className: "mb-2 block text-sm font-medium",
                            style: { color: PALETTE.muted },
                            children: "Email"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "email",
                            defaultValue: "caregiver@dhatuscan.app",
                            className: "w-full rounded-2xl px-4 py-3 text-sm outline-none",
                            style: {
                              backgroundColor: PALETTE.white,
                              color: PALETTE.ink,
                              border: `1px solid ${PALETTE.lavender}`
                            }
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "label",
                          {
                            className: "mb-2 block text-sm font-medium",
                            style: { color: PALETTE.muted },
                            children: "Password"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "input",
                          {
                            type: "password",
                            defaultValue: "password",
                            className: "w-full rounded-2xl px-4 py-3 text-sm outline-none",
                            style: {
                              backgroundColor: PALETTE.white,
                              color: PALETTE.ink,
                              border: `1px solid ${PALETTE.lavender}`
                            }
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: enterApp,
                          className: "w-full rounded-2xl px-5 py-3 font-semibold transition-smooth",
                          style: {
                            backgroundColor: PALETTE.buttonDark,
                            color: PALETTE.white
                          },
                          children: "Login / Sign In"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "mt-6 rounded-2xl p-4 text-sm leading-6",
                        style: { backgroundColor: PALETTE.blue, color: "#3d4b56" },
                        children: "Use this login to enter the dashboard, start screening, review nutrition risk results, and guide the next care decision."
                      }
                    )
                  ]
                }
              )
            }
          )
        ] }) })
      ]
    }
  );
}
export {
  AuthPage as default
};
