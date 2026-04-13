import GlassCard from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import { Link } from "@tanstack/react-router";
import { useTheme } from "next-themes";

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
  help,
  surface,
  border,
  shadow,
  muted,
  accent,
}: {
  label: string;
  value: string;
  help: string;
  surface: string;
  border: string;
  shadow: string;
  muted: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-[1.75rem] p-5 transition-smooth hover:-translate-y-1"
      style={{
        background: surface,
        border: `1px solid ${border}`,
        boxShadow: shadow,
        backdropFilter: "blur(14px)",
      }}
    >
      <p className="text-xs uppercase tracking-[0.22em]" style={{ color: muted }}>
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-bold" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-2 text-sm" style={{ color: muted }}>{help}</p>
    </div>
  );
}

export default function DashboardHome() {
  const { state, activeChild, activeAssessments } = useApp();
  const { resolvedTheme } = useTheme();
  const latestAssessment = activeAssessments[0];
  const isDark = resolvedTheme === "dark";

  const pageBg = isDark ? "#141821" : DASHBOARD_BG;
  const surface = isDark ? "rgba(29, 36, 48, 0.76)" : SURFACE;
  const surfaceAlt = isDark ? "rgba(35, 44, 58, 0.82)" : SURFACE_ALT;
  const surfaceSoft = isDark ? "rgba(24, 32, 44, 0.72)" : SURFACE_SOFT;
  const border = isDark ? "rgba(124, 107, 192, 0.22)" : BORDER;
  const text = isDark ? "#F3F2FB" : TEXT;
  const muted = isDark ? "#B8B2C9" : MUTED;
  const accent = isDark ? "#B39BFF" : ACCENT;
  const cardShadow = isDark
    ? "0 18px 38px rgba(0, 0, 0, 0.28)"
    : CARD_SHADOW;
  const cardHover = isDark
    ? "0 22px 44px rgba(0, 0, 0, 0.34)"
    : CARD_HOVER;

  const quickLinks = [
    {
      title: "Start Screening",
      desc: "Capture measurements, camera scan, and child details.",
      to: "/screening",
    },
    {
      title: "View Results & Statistics",
      desc: "See latest risk level, charts, and progress trends.",
      to: "/results",
    },
    {
      title: "Consult a Doctor",
      desc: "Open doctor support, next steps, and care resources.",
      to: "/consult",
    },
  ];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10" style={{ backgroundColor: pageBg }}>
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div
            className="rounded-[2rem] p-8 transition-smooth hover:-translate-y-1"
            style={{
              background: surface,
              border: `1px solid ${border}`,
              boxShadow: cardShadow,
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-sm uppercase tracking-[0.24em]" style={{ color: muted }}>
              Dashboard
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl" style={{ color: text }}>
              Welcome to your
              <span className="block" style={{ color: accent }}>child health home page.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: muted }}>
              Use the sidebar to move between Screening, Results & Statistics,
              Rewards, Consult, and Privacy. This dashboard keeps everything
              clearer after login.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.title}
                  to={item.to}
                  className="rounded-2xl p-4 transition-smooth hover:-translate-y-1"
                  style={{
                    background: surfaceAlt,
                    border: `1px solid ${border}`,
                    boxShadow: cardShadow,
                    backdropFilter: "blur(14px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = cardHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = cardShadow;
                  }}
                >
                  <h2 className="font-semibold" style={{ color: text }}>{item.title}</h2>
                  <p className="mt-2 text-sm leading-6" style={{ color: muted }}>
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div
            className="rounded-[2rem] p-6 transition-smooth hover:-translate-y-1"
            style={{
              background: surface,
              border: `1px solid ${border}`,
              boxShadow: cardShadow,
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: muted }}>
              Active Profile
            </p>
            <div
              className="mt-4 rounded-2xl p-5"
              style={{
                background: surfaceAlt,
                border: `1px solid ${border}`,
                backdropFilter: "blur(14px)",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{ backgroundColor: "#10C57A" }}
                >
                  {activeChild?.name?.slice(0, 2).toUpperCase() ?? "--"}
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold" style={{ color: text }}>
                    {activeChild?.name ?? "No child selected"}
                  </p>
                  <p className="mt-2 text-sm" style={{ color: muted }}>
                    {activeChild
                      ? `${Math.floor(activeChild.age / 12)} years ${activeChild.age % 12} months`
                      : "Create or select a child profile during screening."}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div
                  className="rounded-xl p-3"
                  style={{ background: surfaceSoft, border: `1px solid ${border}` }}
                >
                  <p className="text-xs" style={{ color: muted }}>Reward Level</p>
                  <p className="mt-1 font-semibold" style={{ color: text }}>
                    {state.gamification.levelName}
                  </p>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{ background: surfaceSoft, border: `1px solid ${border}` }}
                >
                  <p className="text-xs" style={{ color: muted }}>Total XP</p>
                  <p className="mt-1 font-semibold" style={{ color: text }}>
                    {state.gamification.xp} XP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Screenings"
            value={String(state.assessments.length)}
            help="Total completed checks in this device."
            surface={surfaceAlt}
            border={border}
            shadow={cardShadow}
            muted={muted}
            accent={accent}
          />
          <StatCard
            label="Children"
            value={String(state.children.length)}
            help="Profiles available for screening and follow-up."
            surface={surfaceAlt}
            border={border}
            shadow={cardShadow}
            muted={muted}
            accent={accent}
          />
          <StatCard
            label="Latest Risk"
            value={latestAssessment ? latestAssessment.riskLevel.toUpperCase() : "N/A"}
            help="Most recent overall risk classification."
            surface={surfaceAlt}
            border={border}
            shadow={cardShadow}
            muted={muted}
            accent={accent}
          />
          <StatCard
            label="Badges"
            value={String(state.gamification.badges.length)}
            help="Unlocked rewards and habit milestones."
            surface={surfaceAlt}
            border={border}
            shadow={cardShadow}
            muted={muted}
            accent={accent}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div
            className="rounded-[2rem] p-6 transition-smooth hover:-translate-y-1"
            style={{
              background: surface,
              border: `1px solid ${border}`,
              boxShadow: cardShadow,
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: muted }}>
              Next Best Actions
            </p>
            <div className="mt-5 space-y-3">
              {[
                "Run a fresh screening if measurements are outdated.",
                "Open Results & Statistics to review the latest risk score.",
                "Use Consult to prepare for a doctor or NGO referral.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: surfaceAlt,
                    border: `1px solid ${border}`,
                    color: muted,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-[2rem] p-6 transition-smooth hover:-translate-y-1"
            style={{
              background: surface,
              border: `1px solid ${border}`,
              boxShadow: cardShadow,
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: muted }}>
              Recent Summary
            </p>
            <div
              className="mt-5 rounded-2xl p-5"
              style={{
                background: surfaceAlt,
                border: `1px solid ${border}`,
                backdropFilter: "blur(14px)",
              }}
            >
              <p className="font-semibold" style={{ color: text }}>
                {latestAssessment
                  ? `Last screening showed ${latestAssessment.riskLevel} risk and ${latestAssessment.whoStatus} WHO status.`
                  : "No screening has been completed yet."}
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: muted }}>
                {latestAssessment
                  ? "You can review charts in Results & Statistics, continue motivation in Rewards, or move to Consult for professional care guidance."
                  : "Start from Screening to create the first assessment and unlock your dashboard insights."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
