import { a as useApp, j as jsxRuntimeExports, L as Link } from "./index-BzFT_KhA.js";
const DASHBOARD_BG = "#F2EAE0";
const SURFACE = "rgba(255, 250, 245, 0.42)";
const SURFACE_ALT = "rgba(255, 250, 245, 0.56)";
const SURFACE_SOFT = "rgba(255, 250, 245, 0.34)";
const BORDER = "rgba(156, 143, 203, 0.18)";
const TEXT = "#403552";
const MUTED = "#6D6578";
const ACCENT = "#9C8FCB";
const CARD_SHADOW = "0 14px 32px rgba(120, 101, 152, 0.08)";
const CARD_HOVER = "0 20px 38px rgba(120, 101, 152, 0.14)";
function StatCard({
  label,
  value,
  help
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-[1.75rem] p-5 transition-smooth hover:-translate-y-1",
      style: {
        background: SURFACE_ALT,
        border: `1px solid ${BORDER}`,
        boxShadow: CARD_SHADOW,
        backdropFilter: "blur(14px)"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.22em]", style: { color: MUTED }, children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 font-display text-3xl font-bold", style: { color: ACCENT }, children: value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm", style: { color: MUTED }, children: help })
      ]
    }
  );
}
function DashboardHome() {
  const { state, activeChild, activeAssessments } = useApp();
  const latestAssessment = activeAssessments[0];
  const quickLinks = [
    {
      title: "Start Screening",
      desc: "Capture measurements, camera scan, and child details.",
      to: "/screening"
    },
    {
      title: "View Results & Statistics",
      desc: "See latest risk level, charts, and progress trends.",
      to: "/results"
    },
    {
      title: "Consult a Doctor",
      desc: "Open doctor support, next steps, and care resources.",
      to: "/consult"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-8 sm:px-6 lg:px-10", style: { backgroundColor: DASHBOARD_BG }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-6 lg:grid-cols-[1.2fr_0.8fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "rounded-[2rem] p-8 transition-smooth hover:-translate-y-1",
          style: {
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            boxShadow: CARD_SHADOW,
            backdropFilter: "blur(16px)"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm uppercase tracking-[0.24em]", style: { color: MUTED }, children: "Dashboard" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-4 font-display text-4xl font-bold sm:text-5xl", style: { color: TEXT }, children: [
              "Welcome to your",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block", style: { color: ACCENT }, children: "child health home page." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-2xl text-base leading-7", style: { color: MUTED }, children: "Use the sidebar to move between Screening, Results & Statistics, Rewards, Consult, and Privacy. This dashboard keeps everything clearer after login." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid gap-4 sm:grid-cols-3", children: quickLinks.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Link,
              {
                to: item.to,
                className: "rounded-2xl p-4 transition-smooth hover:-translate-y-1",
                style: {
                  background: SURFACE_ALT,
                  border: `1px solid ${BORDER}`,
                  boxShadow: CARD_SHADOW,
                  backdropFilter: "blur(14px)"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.boxShadow = CARD_HOVER;
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.boxShadow = CARD_SHADOW;
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold", style: { color: TEXT }, children: item.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-6", style: { color: MUTED }, children: item.desc })
                ]
              },
              item.title
            )) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "rounded-[2rem] p-6 transition-smooth hover:-translate-y-1",
          style: {
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            boxShadow: CARD_SHADOW,
            backdropFilter: "blur(16px)"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.22em]", style: { color: MUTED }, children: "Active Profile" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "mt-4 rounded-2xl p-5",
                style: {
                  background: SURFACE_ALT,
                  border: `1px solid ${BORDER}`,
                  backdropFilter: "blur(14px)"
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-2xl font-semibold", style: { color: TEXT }, children: (activeChild == null ? void 0 : activeChild.name) ?? "No child selected" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm", style: { color: MUTED }, children: activeChild ? `${Math.floor(activeChild.age / 12)} years ${activeChild.age % 12} months` : "Create or select a child profile during screening." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "rounded-xl p-3",
                        style: { background: SURFACE_SOFT, border: `1px solid ${BORDER}` },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", style: { color: MUTED }, children: "Reward Level" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-semibold", style: { color: TEXT }, children: state.gamification.levelName })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: "rounded-xl p-3",
                        style: { background: SURFACE_SOFT, border: `1px solid ${BORDER}` },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", style: { color: MUTED }, children: "Total XP" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 font-semibold", style: { color: TEXT }, children: [
                            state.gamification.xp,
                            " XP"
                          ] })
                        ]
                      }
                    )
                  ] })
                ]
              }
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          label: "Screenings",
          value: String(state.assessments.length),
          help: "Total completed checks in this device."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          label: "Children",
          value: String(state.children.length),
          help: "Profiles available for screening and follow-up."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          label: "Latest Risk",
          value: latestAssessment ? latestAssessment.riskLevel.toUpperCase() : "N/A",
          help: "Most recent overall risk classification."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatCard,
        {
          label: "Badges",
          value: String(state.gamification.badges.length),
          help: "Unlocked rewards and habit milestones."
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "rounded-[2rem] p-6 transition-smooth hover:-translate-y-1",
          style: {
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            boxShadow: CARD_SHADOW,
            backdropFilter: "blur(16px)"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.22em]", style: { color: MUTED }, children: "Next Best Actions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 space-y-3", children: [
              "Run a fresh screening if measurements are outdated.",
              "Open Results & Statistics to review the latest risk score.",
              "Use Consult to prepare for a doctor or NGO referral."
            ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "rounded-2xl px-4 py-3 text-sm",
                style: {
                  background: SURFACE_ALT,
                  border: `1px solid ${BORDER}`,
                  color: MUTED,
                  backdropFilter: "blur(12px)"
                },
                children: item
              },
              item
            )) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "rounded-[2rem] p-6 transition-smooth hover:-translate-y-1",
          style: {
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            boxShadow: CARD_SHADOW,
            backdropFilter: "blur(16px)"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.22em]", style: { color: MUTED }, children: "Recent Summary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "mt-5 rounded-2xl p-5",
                style: {
                  background: SURFACE_ALT,
                  border: `1px solid ${BORDER}`,
                  backdropFilter: "blur(14px)"
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", style: { color: TEXT }, children: latestAssessment ? `Last screening showed ${latestAssessment.riskLevel} risk and ${latestAssessment.whoStatus} WHO status.` : "No screening has been completed yet." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm leading-6", style: { color: MUTED }, children: latestAssessment ? "You can review charts in Results & Statistics, continue motivation in Rewards, or move to Consult for professional care guidance." : "Start from Screening to create the first assessment and unlock your dashboard insights." })
                ]
              }
            )
          ]
        }
      )
    ] })
  ] }) });
}
export {
  DashboardHome as default
};
