import GlassCard from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import { Link } from "@tanstack/react-router";

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
}: {
  label: string;
  value: string;
  help: string;
}) {
  return (
    <div
      className="rounded-[1.75rem] p-5 transition-smooth hover:-translate-y-1"
      style={{
        background: SURFACE_ALT,
        border: `1px solid ${BORDER}`,
        boxShadow: CARD_SHADOW,
        backdropFilter: "blur(14px)",
      }}
    >
      <p className="text-xs uppercase tracking-[0.22em]" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-bold" style={{ color: ACCENT }}>
        {value}
      </p>
      <p className="mt-2 text-sm" style={{ color: MUTED }}>{help}</p>
    </div>
  );
}

export default function DashboardHome() {
  const { state, activeChild, activeAssessments } = useApp();
  const latestAssessment = activeAssessments[0];

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
    <div className="px-4 py-8 sm:px-6 lg:px-10" style={{ backgroundColor: DASHBOARD_BG }}>
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div
            className="rounded-[2rem] p-8 transition-smooth hover:-translate-y-1"
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              boxShadow: CARD_SHADOW,
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-sm uppercase tracking-[0.24em]" style={{ color: MUTED }}>
              Dashboard
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl" style={{ color: TEXT }}>
              Welcome to your
              <span className="block" style={{ color: ACCENT }}>child health home page.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: MUTED }}>
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
                    background: SURFACE_ALT,
                    border: `1px solid ${BORDER}`,
                    boxShadow: CARD_SHADOW,
                    backdropFilter: "blur(14px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = CARD_HOVER;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = CARD_SHADOW;
                  }}
                >
                  <h2 className="font-semibold" style={{ color: TEXT }}>{item.title}</h2>
                  <p className="mt-2 text-sm leading-6" style={{ color: MUTED }}>
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div
            className="rounded-[2rem] p-6 transition-smooth hover:-translate-y-1"
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              boxShadow: CARD_SHADOW,
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: MUTED }}>
              Active Profile
            </p>
            <div
              className="mt-4 rounded-2xl p-5"
              style={{
                background: SURFACE_ALT,
                border: `1px solid ${BORDER}`,
                backdropFilter: "blur(14px)",
              }}
            >
              <p className="font-display text-2xl font-semibold" style={{ color: TEXT }}>
                {activeChild?.name ?? "No child selected"}
              </p>
              <p className="mt-2 text-sm" style={{ color: MUTED }}>
                {activeChild
                  ? `${Math.floor(activeChild.age / 12)} years ${activeChild.age % 12} months`
                  : "Create or select a child profile during screening."}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div
                  className="rounded-xl p-3"
                  style={{ background: SURFACE_SOFT, border: `1px solid ${BORDER}` }}
                >
                  <p className="text-xs" style={{ color: MUTED }}>Reward Level</p>
                  <p className="mt-1 font-semibold" style={{ color: TEXT }}>
                    {state.gamification.levelName}
                  </p>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{ background: SURFACE_SOFT, border: `1px solid ${BORDER}` }}
                >
                  <p className="text-xs" style={{ color: MUTED }}>Total XP</p>
                  <p className="mt-1 font-semibold" style={{ color: TEXT }}>
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
          />
          <StatCard
            label="Children"
            value={String(state.children.length)}
            help="Profiles available for screening and follow-up."
          />
          <StatCard
            label="Latest Risk"
            value={latestAssessment ? latestAssessment.riskLevel.toUpperCase() : "N/A"}
            help="Most recent overall risk classification."
          />
          <StatCard
            label="Badges"
            value={String(state.gamification.badges.length)}
            help="Unlocked rewards and habit milestones."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div
            className="rounded-[2rem] p-6 transition-smooth hover:-translate-y-1"
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              boxShadow: CARD_SHADOW,
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: MUTED }}>
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
                    background: SURFACE_ALT,
                    border: `1px solid ${BORDER}`,
                    color: MUTED,
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
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              boxShadow: CARD_SHADOW,
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: MUTED }}>
              Recent Summary
            </p>
            <div
              className="mt-5 rounded-2xl p-5"
              style={{
                background: SURFACE_ALT,
                border: `1px solid ${BORDER}`,
                backdropFilter: "blur(14px)",
              }}
            >
              <p className="font-semibold" style={{ color: TEXT }}>
                {latestAssessment
                  ? `Last screening showed ${latestAssessment.riskLevel} risk and ${latestAssessment.whoStatus} WHO status.`
                  : "No screening has been completed yet."}
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: MUTED }}>
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
