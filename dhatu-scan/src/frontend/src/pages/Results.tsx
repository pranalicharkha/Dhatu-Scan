import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import type { Assessment, RiskLevel, WHOStatus } from "@/types/index";
import {
  getRiskCategory,
  getRiskLevelColor,
  getWHOStatusColor,
} from "@/utils/assessmentLogic";
import { getAssessments } from "@/utils/storage";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

// ─── Recommendation Data ─────────────────────────────────────────────────────

interface Recommendation {
  icon: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

const RECOMMENDATIONS: Record<RiskLevel, Recommendation[]> = {
  low: [
    {
      icon: "🥗",
      title: "Maintain Balanced Diet",
      description:
        "Continue providing diverse food groups — grains, proteins, fruits, vegetables, and dairy. Great progress so far!",
      priority: "low",
    },
    {
      icon: "💧",
      title: "Clean Water Access",
      description:
        "Ensure continuous access to piped or purified water to prevent waterborne infections.",
      priority: "low",
    },
    {
      icon: "📅",
      title: "Schedule Next Checkup",
      description:
        "Set a monthly checkup reminder to track ongoing growth and catch any early changes.",
      priority: "medium",
    },
    {
      icon: "🏃",
      title: "Encourage Active Play",
      description:
        "Active outdoor play supports healthy muscle development and appetite regulation.",
      priority: "low",
    },
  ],
  moderate: [
    {
      icon: "🥦",
      title: "Increase Dietary Diversity",
      description:
        "Add iron-rich foods (legumes, leafy greens), vitamin A sources, and zinc-rich foods to daily meals.",
      priority: "high",
    },
    {
      icon: "🏥",
      title: "Visit Healthcare Provider",
      description:
        "Consult a pediatrician or community health worker within the next 2 weeks for a full evaluation.",
      priority: "high",
    },
    {
      icon: "💧",
      title: "Improve Water Source",
      description:
        "Switch to a safer water source or use household water treatment to reduce infection risk.",
      priority: "medium",
    },
    {
      icon: "📊",
      title: "Track Weight Weekly",
      description:
        "Monitor weight at home or at the nearest health centre weekly to catch deterioration early.",
      priority: "medium",
    },
  ],
  high: [
    {
      icon: "🚨",
      title: "Seek Immediate Medical Attention",
      description:
        "Visit the nearest hospital or nutrition rehabilitation centre immediately. Severe malnutrition requires professional intervention.",
      priority: "high",
    },
    {
      icon: "🍼",
      title: "Therapeutic Feeding Program",
      description:
        "Enrol in a Ready-to-Use Therapeutic Food (RUTF) program if available in your area. Contact your local health authority.",
      priority: "high",
    },
    {
      icon: "🔬",
      title: "Test for Underlying Conditions",
      description:
        "Request screening for infections, parasites, and micronutrient deficiencies that may be contributing to poor growth.",
      priority: "high",
    },
    {
      icon: "🤝",
      title: "Community Support Resources",
      description:
        "Reach out to local NGOs, government nutrition programs, or Anganwadi workers for supplementary feeding support.",
      priority: "medium",
    },
  ],
};

const IMPROVEMENT_TIPS = [
  {
    id: "nutrition",
    icon: "🥘",
    title: "Nutrition Tips",
    tips: [
      "Include eggs, lentils, or meat in at least one meal per day",
      "Add a fruit or vegetable to every meal",
      "Use iodised salt and fortified cooking oil",
      "Offer small, frequent meals (5–6 times daily for young children)",
      "Avoid filling snacks like chips or sugary drinks that reduce appetite",
    ],
  },
  {
    id: "healthcare",
    icon: "💊",
    title: "Healthcare Tips",
    tips: [
      "Ensure all vaccinations are up to date",
      "Deworm every 6 months for children over 1 year",
      "Seek treatment promptly for diarrhoea or fever",
      "Monitor growth using a Road-to-Health chart",
      "Ask your health worker about vitamin A supplementation",
    ],
  },
  {
    id: "hydration",
    icon: "🚰",
    title: "Hydration Tips",
    tips: [
      "Boil water for at least 1 minute if unsure of quality",
      "Wash hands with soap before preparing food and feeding",
      "Use covered containers to store drinking water",
      "Give ORS (Oral Rehydration Solution) immediately during diarrhoea",
      "Aim for at least 6–8 cups of safe water per day for children >2 years",
    ],
  },
];

// ─── Score Gauge Component ────────────────────────────────────────────────────

function ScoreGauge({
  value,
  label,
  colorHex,
  delay = 0,
}: {
  value: number;
  label: string;
  colorHex: string;
  delay?: number;
}) {
  const data = [{ value, fill: colorHex }];

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="100%"
            startAngle={225}
            endAngle={-45}
            data={data}
          >
            <RadialBar
              background={{ fill: "rgba(255,255,255,0.05)" }}
              dataKey="value"
              cornerRadius={6}
              max={100}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold font-display leading-none"
            style={{ color: colorHex }}
          >
            {Math.round(value)}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            / 100
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center leading-tight px-1">
        {label}
      </span>
    </motion.div>
  );
}

// ─── WHO Z-Score Bar ──────────────────────────────────────────────────────────

function WHOZScoreBar({
  zScore,
  status,
}: { zScore: number; status: WHOStatus }) {
  const color = getWHOStatusColor(status);
  // Map z-score (-3 to +3) to percentage (0–100%)
  const clampedZ = Math.max(-3, Math.min(3, zScore));
  const pct = ((clampedZ + 3) / 6) * 100;

  const zones = [
    { label: "Severe", color: "#dc2626", width: "16.7%" },
    { label: "Wasted", color: "#ef4444", width: "16.7%" },
    { label: "Stunted", color: "#f97316", width: "16.7%" },
    { label: "Mild", color: "#f59e0b", width: "16.7%" },
    { label: "Normal", color: "#10b981", width: "16.7%" },
    { label: "Healthy", color: "#059669", width: "16.7%" },
  ];

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="relative h-4 rounded-full overflow-hidden flex">
        {zones.map((z) => (
          <div
            key={z.label}
            className="h-full"
            style={{ width: z.width, background: z.color, opacity: 0.75 }}
          />
        ))}
        {/* Indicator needle */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-foreground shadow-lg z-10"
          style={{ left: `calc(${pct}% - 6px)`, background: color }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        />
      </div>
      {/* Scale labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
        <span>-3 (Severe)</span>
        <span>-2</span>
        <span>-1</span>
        <span>0</span>
        <span>+1</span>
        <span>+2</span>
        <span>+3 (Healthy)</span>
      </div>
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  index,
}: { rec: Recommendation; index: number }) {
  const priorityConfig = {
    high: {
      label: "High Priority",
      class: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    medium: {
      label: "Medium Priority",
      class: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    low: {
      label: "Good Practice",
      class: "bg-green-500/20 text-green-400 border-green-500/30",
    },
  };
  const cfg = priorityConfig[rec.priority];

  return (
    <GlassCard
      animate
      delay={0.1 * index}
      hover
      variant="elevated"
      className="p-4"
    >
      <div className="flex gap-3 items-start">
        <div className="text-3xl flex-shrink-0 mt-0.5">{rec.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground text-sm">
              {rec.title}
            </h4>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.class}`}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {rec.description}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Improvement Tip Card ─────────────────────────────────────────────────────

function TipCard({
  tip,
  index,
}: { tip: (typeof IMPROVEMENT_TIPS)[number]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <GlassCard
      animate
      delay={0.12 * index}
      variant="default"
      className="overflow-hidden"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen((p) => !p)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((p) => !p)}
        data-ocid={`tip-toggle-${tip.id}`}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{tip.icon}</span>
          <span className="font-medium text-foreground text-sm">
            {tip.title}
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-muted-foreground text-lg leading-none"
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="tip-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <ul className="px-4 pb-4 space-y-2">
              {tip.tips.map((t) => (
                <li
                  key={t}
                  className="flex gap-2 text-xs text-muted-foreground"
                >
                  <span className="text-primary mt-0.5">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

// ─── Recheck Modal ────────────────────────────────────────────────────────────

function RecheckModal({ onClose }: { onClose: () => void }) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In a real app this would schedule a notification
    setSaved(true);
    setTimeout(onClose, 1500);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />
      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.25 }}
      >
        <GlassCard variant="elevated" className="p-6">
          <h3 className="font-display font-bold text-lg text-foreground mb-1">
            Set Recheck Reminder
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            We'll remind you to perform the next assessment on this date.
          </p>
          <label
            htmlFor="recheck-date"
            className="block text-xs text-muted-foreground mb-1 font-medium"
          >
            Reminder Date
          </label>
          <input
            id="recheck-date"
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-ocid="recheck-date-input"
          />
          {saved ? (
            <div className="text-center text-primary font-medium text-sm py-2">
              ✓ Reminder saved!
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={onClose}
                data-ocid="recheck-cancel"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 gradient-teal text-primary-foreground border-0"
                onClick={handleSave}
                data-ocid="recheck-save"
              >
                Save Reminder
              </Button>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// ─── Risk Banner ──────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<
  RiskLevel,
  { bg: string; border: string; emoji: string; glow: string }
> = {
  low: {
    bg: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/30",
    emoji: "✅",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.15)]",
  },
  moderate: {
    bg: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/30",
    emoji: "⚠️",
    glow: "shadow-[0_0_40px_rgba(245,158,11,0.15)]",
  },
  high: {
    bg: "from-red-500/20 to-rose-500/10",
    border: "border-red-500/30",
    emoji: "🚨",
    glow: "shadow-[0_0_40px_rgba(239,68,68,0.2)]",
  },
};

// ─── WHO Pie Mini-chart ───────────────────────────────────────────────────────

function WHOPie({ zScore, color }: { zScore: number; color: string }) {
  // Map z-score to a 0–100 "health" value for display
  const pct = Math.max(0, Math.min(100, ((zScore + 3) / 6) * 100));
  const data = [
    { value: pct, fill: color },
    { value: 100 - pct, fill: "rgba(255,255,255,0.06)" },
  ];

  return (
    <div className="w-24 h-24 relative flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i === 0 ? "filled" : "empty"} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-display" style={{ color }}>
          {zScore > 0 ? "+" : ""}
          {zScore.toFixed(1)}
        </span>
        <span className="text-[9px] text-muted-foreground">Z-score</span>
      </div>
    </div>
  );
}

// ─── Main Results Page ────────────────────────────────────────────────────────

export default function Results() {
  const navigate = useNavigate();
  const { state, activeChild } = useApp();
  const [recheckOpen, setRecheckOpen] = useState(false);

  // Determine assessment to display
  const latestFromContext =
    activeChild && state.assessments.length > 0
      ? (state.assessments.find((a) => a.childId === activeChild.id) ?? null)
      : null;

  const assessment: Assessment | null =
    latestFromContext ??
    (() => {
      const all = getAssessments();
      return all.length > 0
        ? [...all].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )[0]
        : null;
    })();

  // If truly no data, show placeholder
  if (!assessment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-5xl">📋</div>
        <h2 className="font-display font-bold text-2xl text-foreground">
          No Assessment Found
        </h2>
        <p className="text-muted-foreground text-center max-w-xs">
          Complete a child assessment to view the results dashboard.
        </p>
        <Button
          className="gradient-teal text-primary-foreground border-0 px-8"
          onClick={() => navigate({ to: "/form" })}
          data-ocid="no-results-start-cta"
        >
          Start Assessment
        </Button>
      </div>
    );
  }

  const riskCategory = getRiskCategory(assessment.finalScore);
  const riskColor = getRiskLevelColor(assessment.riskLevel);
  const whoColor = getWHOStatusColor(assessment.whoStatus);
  const riskCfg = RISK_CONFIG[assessment.riskLevel];
  const recommendations = RECOMMENDATIONS[assessment.riskLevel];

  // Snapshot non-null assessment for use inside closures
  const a = assessment;
  const childName = activeChild?.name ?? "Child";
  const assessmentDate = new Date(a.date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Gauge colors
  const wastingColor =
    a.wastingScore <= 30
      ? "#10b981"
      : a.wastingScore <= 60
        ? "#f59e0b"
        : "#ef4444";
  const dietaryColor =
    a.dietaryScore <= 30
      ? "#10b981"
      : a.dietaryScore <= 60
        ? "#f59e0b"
        : "#ef4444";

  const handleDownload = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      childName,
      assessmentDate,
      scores: {
        wastingScore: a.wastingScore,
        dietaryScore: a.dietaryScore,
        finalScore: a.finalScore,
      },
      riskLevel: riskCategory.label,
      whoZScore: a.whoZScore,
      whoStatus: a.whoStatus,
      recommendations: recommendations.map((r) => r.title),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DhatuScan_Report_${childName.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen gradient-hero">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* ── Risk Level Banner ── */}
        <motion.div
          className={`relative rounded-2xl border p-6 bg-gradient-to-br overflow-hidden ${riskCfg.bg} ${riskCfg.border} ${riskCfg.glow}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          data-ocid="risk-banner"
        >
          {/* Decorative blob */}
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: riskColor, filter: "blur(30px)" }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{riskCfg.emoji}</span>
              <div>
                <div
                  className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                  style={{ color: riskColor }}
                >
                  Assessment Result
                </div>
                <h1
                  className="font-display font-bold text-2xl leading-tight"
                  style={{ color: riskColor }}
                >
                  {riskCategory.label}
                </h1>
              </div>
            </div>
            <p className="text-sm text-foreground/80 mb-3">
              {riskCategory.description}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                👤 <strong className="text-foreground">{childName}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                📅 <span>{assessmentDate}</span>
              </span>
              {assessment.cameraAnalyzed && assessment.cameraConfidence && (
                <span className="flex items-center gap-1.5">
                  📷 AI Confidence:{" "}
                  <strong className="text-primary">
                    {assessment.cameraConfidence}%
                  </strong>
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Score Gauges ── */}
        <GlassCard animate variant="elevated" className="p-6">
          <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wide mb-5 text-center">
            Score Breakdown
          </h2>
          <div className="grid grid-cols-3 gap-2" data-ocid="score-gauges">
            <ScoreGauge
              value={assessment.wastingScore}
              label="Wasting Score"
              colorHex={wastingColor}
              delay={0.1}
            />
            <ScoreGauge
              value={assessment.dietaryScore}
              label="Dietary Risk"
              colorHex={dietaryColor}
              delay={0.2}
            />
            <ScoreGauge
              value={assessment.finalScore}
              label="Final Fusion Score"
              colorHex={riskColor}
              delay={0.3}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground text-center">
              FinalScore = 0.7 × WastingScore + 0.3 × DietaryRisk &nbsp;|&nbsp;
              <span className="text-primary">
                0–30 Low · 31–60 Moderate · 61–100 High
              </span>
            </p>
          </div>
        </GlassCard>

        {/* ── WHO Z-Score Card ── */}
        <GlassCard animate delay={0.15} variant="elevated" className="p-6">
          <div className="flex items-start gap-4" data-ocid="who-zscore-card">
            <WHOPie zScore={assessment.whoZScore} color={whoColor} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-display font-semibold text-foreground">
                  WHO Z-Score
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 border font-medium"
                  style={{
                    color: whoColor,
                    borderColor: `${whoColor}50`,
                    background: `${whoColor}15`,
                  }}
                >
                  {assessment.whoStatus.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {
                  {
                    normal: "Growth is within healthy WHO standards for age.",
                    underweight:
                      "Weight is slightly below the WHO reference median.",
                    stunted:
                      "Height is significantly below the WHO standard for age.",
                    wasted:
                      "Acute malnutrition — weight-for-height is critically low.",
                    severe_wasting:
                      "Severe acute malnutrition — immediate intervention required.",
                  }[assessment.whoStatus]
                }
              </p>
              <WHOZScoreBar
                zScore={assessment.whoZScore}
                status={assessment.whoStatus}
              />
            </div>
          </div>
        </GlassCard>

        {/* ── Recommendations ── */}
        <div>
          <motion.h2
            className="font-display font-bold text-foreground text-lg mb-3 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span>💡</span> Recommendations
          </motion.h2>
          <div className="grid gap-3" data-ocid="recommendations-list">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.title} rec={rec} index={i} />
            ))}
          </div>
        </div>

        {/* ── Improvement Tips ── */}
        <div>
          <motion.h2
            className="font-display font-bold text-foreground text-lg mb-3 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span>📌</span> Improvement Suggestions
          </motion.h2>
          <div className="space-y-3" data-ocid="improvement-tips">
            {IMPROVEMENT_TIPS.map((tip, i) => (
              <TipCard key={tip.id} tip={tip} index={i} />
            ))}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <GlassCard animate delay={0.2} variant="default" className="p-4">
          <div
            className="grid grid-cols-2 gap-3"
            data-ocid="action-buttons-row"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-border/60"
              onClick={handleDownload}
              data-ocid="download-report-btn"
            >
              <span>⬇️</span> Download Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-border/60"
              onClick={() => setRecheckOpen(true)}
              data-ocid="recheck-reminder-btn"
            >
              <span>🔔</span> Set Reminder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-primary hover:text-primary"
              onClick={() => navigate({ to: "/history" })}
              data-ocid="view-history-btn"
            >
              <span>📈</span> Growth History
            </Button>
            <Button
              size="sm"
              className="gap-2 text-xs gradient-teal text-primary-foreground border-0"
              onClick={() => navigate({ to: "/form" })}
              data-ocid="new-assessment-btn"
            >
              <span>🔄</span> New Assessment
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* ── Recheck Modal ── */}
      <AnimatePresence>
        {recheckOpen && <RecheckModal onClose={() => setRecheckOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
