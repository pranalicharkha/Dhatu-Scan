import { useApp } from "@/context/AppContext";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DASHBOARD_BG = "#F2EAE0";
const SURFACE = "rgba(255, 250, 245, 0.42)";
const SURFACE_ALT = "rgba(255, 250, 245, 0.56)";
const SURFACE_SOFT = "rgba(255, 250, 245, 0.34)";
const BORDER = "rgba(156, 143, 203, 0.18)";
const TEXT = "#403552";
const MUTED = "#6D6578";
const ACCENT = "#9C8FCB";
const ACCENT_SOFT = "#6CC7B5";
const CARD_SHADOW = "0 14px 32px rgba(120, 101, 152, 0.08)";
const CARD_HOVER = "0 20px 38px rgba(120, 101, 152, 0.14)";

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatRiskLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatWhoLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCompactDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getMalnutritionChartColor(whoStatus: string) {
  return whoStatus === "normal" ? "#16A34A" : "#DC2626";
}

function getAssessmentPriorityScore(assessment: {
  riskLevel: string;
  finalScore: number;
  dietaryScore: number;
  whoStatus: string;
}) {
  const riskWeight =
    assessment.riskLevel === "high" ? 3 : assessment.riskLevel === "moderate" ? 2 : 1;
  const whoPenalty = assessment.whoStatus === "normal" ? 0 : 20;
  return riskWeight * 100 + whoPenalty + (100 - assessment.finalScore) + (100 - assessment.dietaryScore);
}

function getRiskCause(assessment: {
  dietaryScore: number;
  dietDiversity: number;
  recentDiarrhea: number;
  waterSource: number;
  whoStatus: string;
  imageVisibleSigns?: string[];
}) {
  const visibleSign = assessment.imageVisibleSigns?.[0];

  if (assessment.dietaryScore < 45 || assessment.dietDiversity <= 3) {
    return "Low diet diversity and weak nutrition intake are the strongest risk signals right now.";
  }
  if (assessment.recentDiarrhea < 5) {
    return "Recent diarrhea history may be worsening nutrient absorption and increasing malnutrition risk.";
  }
  if (assessment.waterSource < 5) {
    return "Unsafe water conditions may be affecting overall nutrition and recovery.";
  }
  if (assessment.whoStatus !== "normal") {
    return `Growth screening is showing ${formatWhoLabel(assessment.whoStatus).toLowerCase()} markers that need close follow-up.`;
  }
  if (visibleSign) {
    return `Visible screening signs suggest attention is needed around ${visibleSign.toLowerCase()}.`;
  }

  return "Current screening scores suggest this child should be reviewed again soon to prevent worsening risk.";
}

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

function DashboardCard({
  children,
  background,
  border,
  shadow,
  onHover = false,
}: {
  children: ReactNode;
  background: string;
  border: string;
  shadow: string;
  onHover?: boolean;
}) {
  return (
    <div
      className="rounded-[2rem] p-6 transition-smooth hover:-translate-y-1"
      style={{
        background,
        border: `1px solid ${border}`,
        boxShadow: shadow,
        backdropFilter: "blur(16px)",
      }}
      onMouseEnter={
        onHover
          ? (e) => {
              e.currentTarget.style.boxShadow = CARD_HOVER;
            }
          : undefined
      }
      onMouseLeave={
        onHover
          ? (e) => {
              e.currentTarget.style.boxShadow = shadow;
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export default function DashboardHome() {
  const { state, activeChild, activeAssessments } = useApp();
  const { resolvedTheme } = useTheme();
  const latestAssessment = activeAssessments[0];
  const latestOverallAssessment = state.assessments[0];
  const recentChild = latestOverallAssessment
    ? state.children.find((child) => child.id === latestOverallAssessment.childId)
    : null;
  const isDark = resolvedTheme === "dark";

  const pageBg = isDark ? "#141821" : DASHBOARD_BG;
  const surface = isDark ? "rgba(29, 36, 48, 0.76)" : SURFACE;
  const surfaceAlt = isDark ? "rgba(35, 44, 58, 0.82)" : SURFACE_ALT;
  const surfaceSoft = isDark ? "rgba(24, 32, 44, 0.72)" : SURFACE_SOFT;
  const border = isDark ? "rgba(124, 107, 192, 0.22)" : BORDER;
  const text = isDark ? "#F3F2FB" : TEXT;
  const muted = isDark ? "#B8B2C9" : MUTED;
  const accent = isDark ? "#B39BFF" : ACCENT;
  const accentSoft = isDark ? "#73DDC7" : ACCENT_SOFT;
  const cardShadow = isDark
    ? "0 18px 38px rgba(0, 0, 0, 0.28)"
    : CARD_SHADOW;
  const allAssessments = state.assessments;
  const highestRiskAssessment = [...allAssessments].sort(
    (a, b) => getAssessmentPriorityScore(b) - getAssessmentPriorityScore(a),
  )[0];
  const mostAtRiskChild = highestRiskAssessment
    ? state.children.find((child) => child.id === highestRiskAssessment.childId)
    : null;
  const riskNeedsAttention =
    highestRiskAssessment &&
    (highestRiskAssessment.riskLevel === "high" ||
      highestRiskAssessment.riskLevel === "moderate");
  const healthiestAssessment = [...allAssessments].sort((a, b) => {
    const aScore =
      (a.riskLevel === "low" ? 200 : 0) +
      (a.whoStatus === "normal" ? 100 : 0) +
      a.finalScore +
      a.dietaryScore;
    const bScore =
      (b.riskLevel === "low" ? 200 : 0) +
      (b.whoStatus === "normal" ? 100 : 0) +
      b.finalScore +
      b.dietaryScore;
    return bScore - aScore;
  })[0];
  const healthiestChild = healthiestAssessment
    ? state.children.find((child) => child.id === healthiestAssessment.childId)
    : null;
  const recentSummaryDate = latestOverallAssessment
    ? new Date(latestOverallAssessment.date).toLocaleDateString()
    : null;
  const selectedChildAssessments = [...activeAssessments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const selectedChildLatestAssessment =
    selectedChildAssessments[selectedChildAssessments.length - 1] ?? null;
  const chartColor = getMalnutritionChartColor(selectedChildLatestAssessment?.whoStatus ?? "");
  const growthChartData = selectedChildAssessments.map((assessment) => ({
    date: formatCompactDate(assessment.date),
    zScore: assessment.haz ?? assessment.whoZScore,
    score: clampPercent(assessment.finalScore),
  }));
  const zScoreTrend =
    selectedChildAssessments.length >= 2
      ? (selectedChildAssessments[selectedChildAssessments.length - 1].haz ??
          selectedChildAssessments[selectedChildAssessments.length - 1].whoZScore) -
        (selectedChildAssessments[selectedChildAssessments.length - 2].haz ??
          selectedChildAssessments[selectedChildAssessments.length - 2].whoZScore)
      : 0;

  return (
    <div
      className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-10"
      style={{ backgroundColor: pageBg }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(circle at top left, rgba(179,155,255,0.18), transparent 34%), radial-gradient(circle at 85% 15%, rgba(115,221,199,0.12), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(20,24,33,0))"
            : "radial-gradient(circle at top left, rgba(156,143,203,0.20), transparent 34%), radial-gradient(circle at 85% 15%, rgba(108,199,181,0.18), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.38), rgba(242,234,224,0))",
        }}
      />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <DashboardCard background={surface} border={border} shadow={cardShadow}>
            <p className="text-sm uppercase tracking-[0.24em]" style={{ color: muted }}>
              Dashboard
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl" style={{ color: text }}>
              Welcome to Dhatu-Scan
              <span className="block" style={{ color: accent }}>monitor your child health.</span>
            </h1>

            <div className="mt-8">
              {!activeChild || growthChartData.length === 0 ? (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: surfaceAlt,
                    border: `1px solid ${border}`,
                    boxShadow: cardShadow,
                    backdropFilter: "blur(14px)",
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: muted }}>
                    Selected Child Growth
                  </p>
                  <p className="mt-4 text-base leading-7" style={{ color: text }}>
                    {activeChild
                      ? "Complete at least one screening for the selected child to unlock a growth chart and trend view here."
                      : "Select a child profile to see their growth history and dashboard insights."}
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-2xl p-5 transition-smooth hover:-translate-y-1"
                  style={{
                    background: surfaceAlt,
                    border: `1px solid ${border}`,
                    boxShadow: cardShadow,
                    backdropFilter: "blur(14px)",
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: muted }}>
                    Selected Child Growth
                  </p>
                  <div className="mt-4 flex flex-col gap-4">
                    <div>
                      <p className="font-display text-3xl font-bold" style={{ color: text }}>
                        {activeChild.name}'s malnourishment progress.
                      </p>
                      <div
                        className="mt-5 inline-flex rounded-2xl px-5 py-4"
                        style={{ background: surfaceSoft, border: `1px solid ${border}` }}
                      >
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: muted }}>
                            Malnourishment Status
                          </p>
                          <p className="mt-2 text-3xl font-semibold" style={{ color: accentSoft }}>
                            {selectedChildLatestAssessment
                              ? formatWhoLabel(selectedChildLatestAssessment.whoStatus)
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: surfaceSoft, border: `1px solid ${border}` }}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: text }}>
                            Malnutrition Progress
                          </p>
                          <p className="text-xs" style={{ color: muted }}>
                            Latest risk: {selectedChildLatestAssessment ? formatRiskLabel(selectedChildLatestAssessment.riskLevel) : "N/A"}
                          </p>
                        </div>
                        <div
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            color: text,
                            background: "rgba(255,255,255,0.14)",
                            border: `1px solid ${border}`,
                          }}
                        >
                          {selectedChildAssessments.length} checks
                        </div>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={growthChartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                            <defs>
                              <linearGradient id="growthWeightFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.45} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0.04} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke={border} vertical={false} />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: muted, fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: muted, fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              width={36}
                            />
                            <Tooltip
                              contentStyle={{
                                background: isDark ? "rgba(29,36,48,0.96)" : "rgba(255,250,245,0.96)",
                                border: `1px solid ${border}`,
                                borderRadius: "16px",
                                color: text,
                              }}
                              labelStyle={{ color: text, fontWeight: 600 }}
                              formatter={(value) => [`${Number(value).toFixed(2)} z`, "WHO Z-Score"]}
                            />
                            <Area
                              type="monotone"
                              dataKey="zScore"
                              stroke={chartColor}
                              strokeWidth={3}
                              fill="url(#growthWeightFill)"
                              activeDot={{ r: 5, fill: chartColor }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DashboardCard>

          <div className="space-y-6">
            <DashboardCard background={surface} border={border} shadow={cardShadow}>
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
                    style={{
                      background: `linear-gradient(135deg, ${accentSoft}, #10C57A)`,
                      boxShadow: "0 12px 28px rgba(16, 197, 122, 0.24)",
                    }}
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
            </DashboardCard>

            {allAssessments.length === 0 ? null : riskNeedsAttention && highestRiskAssessment && mostAtRiskChild ? (
              <DashboardCard background={surface} border={border} shadow={cardShadow}>
                <p className="text-xs uppercase tracking-[0.22em]" style={{ color: muted }}>
                  Most Urgent Child Update
                </p>
                <p className="mt-4 font-display text-2xl font-bold" style={{ color: text }}>
                  {mostAtRiskChild.name} needs attention first.
                </p>
                <p className="mt-3 text-sm leading-7" style={{ color: muted }}>
                  {formatRiskLabel(highestRiskAssessment.riskLevel)} risk with{" "}
                  {formatWhoLabel(highestRiskAssessment.whoStatus).toLowerCase()} growth markers.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div
                    className="rounded-xl p-4"
                    style={{ background: surfaceAlt, border: `1px solid ${border}` }}
                  >
                    <p className="text-xs" style={{ color: muted }}>Growth Score</p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: accent }}>
                      {clampPercent(highestRiskAssessment.finalScore)}%
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: surfaceAlt, border: `1px solid ${border}` }}
                  >
                    <p className="text-xs" style={{ color: muted }}>Main Cause</p>
                    <p className="mt-2 text-sm font-semibold leading-6" style={{ color: text }}>
                      {highestRiskAssessment.dietaryScore < 45 || highestRiskAssessment.dietDiversity <= 3
                        ? "Low diet diversity"
                        : highestRiskAssessment.recentDiarrhea < 5
                          ? "Recent diarrhea"
                          : highestRiskAssessment.waterSource < 5
                            ? "Unsafe water access"
                            : highestRiskAssessment.whoStatus !== "normal"
                              ? formatWhoLabel(highestRiskAssessment.whoStatus)
                              : "Needs follow-up"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6" style={{ color: muted }}>
                  {getRiskCause(highestRiskAssessment)}
                </p>
              </DashboardCard>
            ) : healthiestAssessment && healthiestChild ? (
              <DashboardCard background={surface} border={border} shadow={cardShadow}>
                <p className="text-xs uppercase tracking-[0.22em]" style={{ color: muted }}>
                  Positive Child Update
                </p>
                <p className="mt-4 font-display text-2xl font-bold" style={{ color: text }}>
                  {healthiestChild.name} is holding steady.
                </p>
                <p className="mt-3 text-sm leading-7" style={{ color: muted }}>
                  The strongest recent outcome is showing low risk and stable growth for this child.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div
                    className="rounded-xl p-4"
                    style={{ background: surfaceAlt, border: `1px solid ${border}` }}
                  >
                    <p className="text-xs" style={{ color: muted }}>Risk</p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: accent }}>
                      {formatRiskLabel(healthiestAssessment.riskLevel)}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: surfaceAlt, border: `1px solid ${border}` }}
                  >
                    <p className="text-xs" style={{ color: muted }}>Growth Score</p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: accentSoft }}>
                      {clampPercent(healthiestAssessment.finalScore)}%
                    </p>
                  </div>
                </div>
              </DashboardCard>
            ) : null}
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
          <DashboardCard background={surface} border={border} shadow={cardShadow}>
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
          </DashboardCard>

          <DashboardCard background={surface} border={border} shadow={cardShadow}>
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
                {latestOverallAssessment && recentChild
                  ? `${recentChild.name} was screened most recently with ${formatRiskLabel(latestOverallAssessment.riskLevel)} risk and ${formatWhoLabel(latestOverallAssessment.whoStatus)} status.`
                  : "There is no recent history to show."}
              </p>
              {latestOverallAssessment && recentChild ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div
                    className="rounded-xl p-3"
                    style={{ background: surfaceSoft, border: `1px solid ${border}` }}
                  >
                    <p className="text-xs" style={{ color: muted }}>Child</p>
                    <p className="mt-1 font-semibold" style={{ color: text }}>
                      {recentChild.name}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: muted }}>
                      {Math.floor(latestOverallAssessment.age / 12)} years {latestOverallAssessment.age % 12} months
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: surfaceSoft, border: `1px solid ${border}` }}
                  >
                    <p className="text-xs" style={{ color: muted }}>Screened On</p>
                    <p className="mt-1 font-semibold" style={{ color: text }}>
                      {recentSummaryDate}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: muted }}>
                      Latest recorded child history
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: surfaceSoft, border: `1px solid ${border}` }}
                  >
                    <p className="text-xs" style={{ color: muted }}>Risk Status</p>
                    <p className="mt-1 font-semibold" style={{ color: text }}>
                      {formatRiskLabel(latestOverallAssessment.riskLevel)}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: muted }}>
                      WHO status {formatWhoLabel(latestOverallAssessment.whoStatus)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6" style={{ color: muted }}>
                  Start from Screening to create the first assessment and unlock your dashboard insights.
                </p>
              )}
            </div>
          </DashboardCard>
        </section>
      </div>
    </div>
  );
}
