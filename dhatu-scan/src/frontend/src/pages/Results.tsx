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
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

const WHO_STATUS_COPY: Record<WHOStatus, string> = {
  normal: "Growth is within healthy WHO standards for age and size.",
  underweight: "Weight-for-age is below the WHO standard and suggests underweight.",
  severe_underweight:
    "Weight-for-age is far below the WHO standard and suggests severe underweight.",
  stunted: "Height-for-age is below the WHO standard and suggests stunting.",
  severe_stunting:
    "Height-for-age is far below the WHO standard and suggests severe stunting.",
  wasted:
    "Weight-for-height is below the WHO standard and suggests wasting.",
  severe_wasting:
    "Weight-for-height is far below the WHO standard and suggests severe wasting.",
};

const WATER_SOURCE_COPY: Record<number, string> = {
  10: "Tap / piped water",
  7: "Borehole / well water",
  3: "Surface water",
  0: "Unprotected water source",
};

function getImageRiskLabel(score: number) {
  if (score <= 30) return { label: "Low visual risk", color: "#8f85b3" };
  if (score <= 60) return { label: "Moderate visual risk", color: "#9b8faf" };
  return { label: "High visual risk", color: "#7f748f" };
}

function getQualityLabel(score: number) {
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Needs recapture";
}

function AnalysisMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "border-border/50 bg-background/40 text-foreground"
      : tone === "warn"
        ? "border-border/50 bg-background/38 text-foreground"
        : tone === "bad"
          ? "border-border/50 bg-background/36 text-foreground"
          : "border-border/40 bg-background/30 text-foreground";

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function ReportRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-right text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

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
      <div className="relative h-28 w-28">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display text-2xl font-bold leading-none"
            style={{ color: colorHex }}
          >
            {Math.round(value)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            / 100
          </span>
        </div>
      </div>
      <span className="px-1 text-center text-xs leading-tight text-muted-foreground">
        {label}
      </span>
    </motion.div>
  );
}

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

function WHOIndicatorCard({
  label,
  title,
  subtitle,
  value,
  status,
}: {
  label: string;
  title: string;
  subtitle: string;
  value: number;
  status: WHOStatus;
}) {
  const color = getWHOStatusColor(status);

  return (
    <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
            <span className="text-[10px] text-muted-foreground/80">
              {subtitle}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ color, background: `${color}14` }}
        >
          {value > 0 ? "+" : ""}
          {value.toFixed(2)}
        </span>
      </div>
      <div className="mt-3 text-sm font-medium capitalize" style={{ color }}>
        {status.replace(/_/g, " ")}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {WHO_STATUS_COPY[status]}
      </p>
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
      class: "bg-background/40 text-foreground border-border/50",
    },
    medium: {
      label: "Medium Priority",
      class: "bg-background/40 text-foreground border-border/50",
    },
    low: {
      label: "Good Practice",
      class: "bg-background/40 text-foreground border-border/50",
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
    (state.assessments.length > 0
      ? [...state.assessments].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0]
      : null);

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
  const imageRisk = a.imageRiskScore ?? 0;
  const imageQuality = a.imageQualityScore ?? 0;
  const imageRiskMeta = getImageRiskLabel(imageRisk);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(64, 53, 82); // #403552
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 250, 245); // #fffaf5
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("DhatuScan Assessment Report", pageWidth / 2, 25, { align: "center" });
    
    // Child Info Section
    doc.setTextColor(64, 53, 82);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Child Information", 14, 55);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    autoTable(doc, {
      startY: 60,
      head: [["Field", "Value"]],
      body: [
        ["Child Name", childName],
        ["Assessment Date", assessmentDate],
        ["Age (Months)", a.age.toString()],
        ["Height (cm)", a.height.toString()],
        ["Weight (kg)", a.weight.toString()],
      ],
      theme: "grid",
      headStyles: { fillColor: [156, 143, 203], textColor: 255 },
      styles: { fontSize: 10 },
    });
    
    // Risk Assessment
    const riskColor = a.finalScore <= 30 ? [16, 185, 129] : a.finalScore <= 60 ? [245, 158, 11] : [239, 68, 68];
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.text(`Risk Level: ${riskCategory.label}`, 14, (doc as any).lastAutoTable.finalY + 15);
    
    // Scores Table
    doc.setTextColor(64, 53, 82);
    doc.text("Assessment Scores", 14, (doc as any).lastAutoTable.finalY + 30);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 35,
      head: [["Metric", "Score", "Status"]],
      body: [
        ["Wasting Score", `${a.wastingScore}/100`, a.wastingScore <= 30 ? "Normal" : a.wastingScore <= 60 ? "Moderate" : "High"],
        ["Dietary Score", `${a.dietaryScore}/100`, a.dietaryScore <= 30 ? "Good" : a.dietaryScore <= 60 ? "Fair" : "Poor"],
        ["Final Score", `${a.finalScore}/100`, riskCategory.label],
        ["WHO Z-Score", a.whoZScore.toFixed(2), a.whoStatus.replace(/_/g, " ")],
      ],
      theme: "grid",
      headStyles: { fillColor: [156, 143, 203], textColor: 255 },
      styles: { fontSize: 10 },
    });
    
    // WHO Indicators
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("WHO Growth Indicators", 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Indicator", "Z-Score", "Status"]],
      body: [
        ["Weight-for-Age (WAZ)", (a.waz ?? a.whoZScore).toFixed(2), (a.underweightStatus ?? a.whoStatus).replace(/_/g, " ")],
        ["Height-for-Age (HAZ)", (a.haz ?? a.whoZScore).toFixed(2), (a.stuntingStatus ?? a.whoStatus).replace(/_/g, " ")],
        ["Weight-for-Height (WHZ)", (a.whz ?? a.whoZScore).toFixed(2), (a.wastingStatus ?? a.whoStatus).replace(/_/g, " ")],
        ["BMI-for-Age (BAZ)", (a.baz ?? Number((a.weight / (a.height / 100) ** 2).toFixed(2))).toFixed(2), a.whoStatus.replace(/_/g, " ")],
      ],
      theme: "grid",
      headStyles: { fillColor: [156, 143, 203], textColor: 255 },
      styles: { fontSize: 10 },
    });
    
    // Recommendations
    if (recommendations.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Recommendations", 14, (doc as any).lastAutoTable.finalY + 15);
      
      const recBody = recommendations.map((r) => [r.title, r.description]);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [["Recommendation", "Details"]],
        body: recBody,
        theme: "grid",
        headStyles: { fillColor: [156, 143, 203], textColor: 255 },
        styles: { fontSize: 9 },
      });
    }
    
    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated by DhatuScan on ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: "center" });
    doc.text("Confidential Health Report - Keep Secure", pageWidth / 2, footerY + 5, { align: "center" });
    
    // Save
    doc.save(`DhatuScan_Report_${childName.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
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
            <div className="mb-2">
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
            <p className="text-sm text-foreground/80 mb-3">
              {riskCategory.description}
            </p>
            <div
              className="hidden flex-wrap gap-3 text-xs text-muted-foreground"
              aria-hidden="true"
            >
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
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{childName}</strong>
              </span>
              <span>{assessmentDate}</span>
              {assessment.cameraAnalyzed && assessment.cameraConfidence && (
                <span>
                  AI Confidence:{" "}
                  <strong className="text-primary">
                    {assessment.cameraConfidence}%
                  </strong>
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Score Gauges ── */}
        <GlassCard
          animate
          variant="elevated"
          className="hidden p-6"
          aria-hidden="true"
        >
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
        <div className="hidden" aria-hidden="true">
        <GlassCard animate delay={0.15} variant="elevated" className="p-6">
          <div className="flex items-start gap-4" data-ocid="who-zscore-card">
            <WHOPie
              zScore={assessment.haz ?? assessment.whoZScore}
              color={whoColor}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-display font-semibold text-foreground">
                  WHO Growth Assessment
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
                  {(assessment.stuntingStatus ?? assessment.whoStatus)
                    .replace(/_/g, " ")
                    .toUpperCase()}
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
              <div className="mb-4 rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  How To Read This
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Underweight uses WAZ, stunting uses HAZ, wasting uses WHZ, and
                  BMI growth analysis uses BAZ. Scores below -2 are concerning
                  and scores below -3 indicate severe risk.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <WHOIndicatorCard
                  label="WAZ"
                  title="Underweight"
                  subtitle="Weight-for-age"
                  value={assessment.waz ?? assessment.whoZScore}
                  status={assessment.underweightStatus ?? assessment.whoStatus}
                />
                <WHOIndicatorCard
                  label="HAZ"
                  title="Stunting"
                  subtitle="Height-for-age"
                  value={assessment.haz ?? assessment.whoZScore}
                  status={assessment.stuntingStatus ?? assessment.whoStatus}
                />
                <WHOIndicatorCard
                  label="WHZ"
                  title="Wasting"
                  subtitle="Weight-for-height"
                  value={assessment.whz ?? assessment.whoZScore}
                  status={assessment.wastingStatus ?? assessment.whoStatus}
                />
                <WHOIndicatorCard
                  label="BAZ"
                  title="BMI-for-age"
                  subtitle="Growth analysis"
                  value={
                    assessment.baz ??
                    Number(
                      (assessment.weight / (assessment.height / 100) ** 2).toFixed(2),
                    )
                  }
                  status={assessment.wastingStatus ?? assessment.whoStatus}
                />
              </div>
              <WHOZScoreBar
                zScore={assessment.haz ?? assessment.whoZScore}
                status={assessment.stuntingStatus ?? assessment.whoStatus}
              />
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard animate delay={0.18} variant="elevated" className="p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  Image Analysis
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Visual findings from the uploaded or captured image.
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 border font-medium"
                style={{
                  color: imageRiskMeta.color,
                  borderColor: `${imageRiskMeta.color}50`,
                  background: `${imageRiskMeta.color}15`,
                }}
              >
                {imageRiskMeta.label.toUpperCase()}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnalysisMetric
                label="Image Risk"
                value={`${imageRisk}/100`}
                tone={
                  imageRisk <= 30 ? "good" : imageRisk <= 60 ? "warn" : "bad"
                }
              />
              <AnalysisMetric
                label="Image Quality"
                value={`${imageQuality}/100 · ${getQualityLabel(imageQuality)}`}
                tone={
                  imageQuality >= 80 ? "good" : imageQuality >= 60 ? "warn" : "bad"
                }
              />
              <AnalysisMetric
                label="Landmarks"
                value={`${a.faceLandmarksDetected ?? 0}/468 face · ${a.bodyLandmarksDetected ?? 0}/33 body`}
                tone={
                  (a.faceLandmarksDetected ?? 0) >= 468 &&
                  (a.bodyLandmarksDetected ?? 0) >= 33
                    ? "good"
                    : "warn"
                }
              />
              <AnalysisMetric
                label="Face Masking"
                value={a.faceMasked ? "Applied" : "Not confirmed"}
              />
            </div>
          </GlassCard>

          <GlassCard animate delay={0.2} variant="elevated" className="p-6">
            <div>
              <h2 className="font-display font-semibold text-foreground">
                User Info Analysis
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Child measurements and submitted health inputs.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnalysisMetric label="Age At Assessment" value={`${a.age} months`} />
              <AnalysisMetric label="Measurements" value={`${a.height} cm · ${a.weight} kg`} />
              <AnalysisMetric
                label="Dietary Risk"
                value={`${a.dietaryScore}/100`}
                tone={
                  a.dietaryScore <= 30
                    ? "good"
                    : a.dietaryScore <= 60
                      ? "warn"
                      : "bad"
                }
              />
              <AnalysisMetric
                label="Diet Diversity"
                value={`${a.dietDiversity}/10`}
                tone={
                  a.dietDiversity >= 7 ? "good" : a.dietDiversity >= 4 ? "warn" : "bad"
                }
              />
            </div>
          </GlassCard>
        </div>

        <GlassCard
          animate
          delay={0.22}
          variant="elevated"
          className="hidden p-6"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Combined Analysis
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Final merged interpretation of all screening inputs.
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 border font-medium"
              style={{
                color: riskColor,
                borderColor: `${riskColor}50`,
                background: `${riskColor}15`,
              }}
            >
              {riskCategory.label.toUpperCase()}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AnalysisMetric
              label="WHO / Anthropometry"
              value={`${a.whoStatus.replace(/_/g, " ")}`}
              tone={
                a.whoStatus === "normal"
                  ? "good"
                  : a.whoStatus.includes("severe")
                    ? "bad"
                    : "warn"
              }
            />
            <AnalysisMetric
              label="Fusion Score"
              value={`${a.finalScore}/100`}
              tone={
                a.finalScore <= 30 ? "good" : a.finalScore <= 60 ? "warn" : "bad"
              }
            />
            <AnalysisMetric
              label="Overall Risk"
              value={riskCategory.label}
              tone={
                a.riskLevel === "low"
                  ? "good"
                  : a.riskLevel === "moderate"
                    ? "warn"
                    : "bad"
              }
            />
          </div>
          <div className="mt-4 rounded-2xl border border-border/40 bg-background/30 p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Combined Summary
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {""}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Image: <span className="text-foreground">{imageRiskMeta.label.toLowerCase()}</span>.
              {" "}User info: <span className="text-foreground">{riskCategory.label.toLowerCase()}</span>.
              {" "}WHO: <span className="text-foreground">{a.whoStatus.replace(/_/g, " ")}</span>.
            </p>
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
            Recommendations
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
            Improvement Suggestions
          </motion.h2>
          <div className="space-y-3" data-ocid="improvement-tips">
            {IMPROVEMENT_TIPS.map((tip, i) => (
              <TipCard key={tip.id} tip={tip} index={i} />
            ))}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        </div>

        <GlassCard animate delay={0.15} variant="elevated" className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Growth Assessment
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                WHO growth interpretation based on the child&apos;s measurements at this visit.
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 border font-medium"
              style={{
                color: whoColor,
                borderColor: `${whoColor}50`,
                background: `${whoColor}15`,
              }}
            >
              {(assessment.stuntingStatus ?? assessment.whoStatus)
                .replace(/_/g, " ")
                .toUpperCase()}
            </Badge>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85">
            {WHO_STATUS_COPY[assessment.whoStatus]}
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
              <ReportRow
                label="Underweight (WAZ)"
                value={`${(assessment.waz ?? assessment.whoZScore).toFixed(2)} · ${(assessment.underweightStatus ?? assessment.whoStatus).replace(/_/g, " ")}`}
              />
              <ReportRow
                label="Stunting (HAZ)"
                value={`${(assessment.haz ?? assessment.whoZScore).toFixed(2)} · ${(assessment.stuntingStatus ?? assessment.whoStatus).replace(/_/g, " ")}`}
              />
              <ReportRow
                label="Wasting (WHZ)"
                value={`${(assessment.whz ?? assessment.whoZScore).toFixed(2)} · ${(assessment.wastingStatus ?? assessment.whoStatus).replace(/_/g, " ")}`}
              />
              <ReportRow
                label="BMI For Age (BAZ)"
                value={`${(
                  assessment.baz ??
                  Number(
                    (assessment.weight / (assessment.height / 100) ** 2).toFixed(2),
                  )
                ).toFixed(2)}`}
              />
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
              <WHOPie
                zScore={assessment.haz ?? assessment.whoZScore}
                color={whoColor}
              />
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Scores below -2 suggest concern and scores below -3 indicate severe risk.
              </p>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard animate delay={0.18} variant="elevated" className="p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  Image Analysis
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Upload quality and landmark detection from the submitted image.
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 border font-medium"
                style={{
                  color: imageRiskMeta.color,
                  borderColor: `${imageRiskMeta.color}50`,
                  background: `${imageRiskMeta.color}15`,
                }}
              >
                {imageRiskMeta.label}
              </Badge>
            </div>
            <div className="mt-5 rounded-2xl border border-border/50 bg-background/30 p-4">
              <ReportRow label="Image Risk" value={`${imageRisk}/100`} />
              <ReportRow
                label="Image Quality"
                value={`${imageQuality}/100 · ${getQualityLabel(imageQuality)}`}
              />
              <ReportRow
                label="Landmarks"
                value={`${a.faceLandmarksDetected ?? 0}/468 face, ${a.bodyLandmarksDetected ?? 0}/33 body`}
              />
              <ReportRow
                label="Face Masking"
                value={a.faceMasked ? "Applied" : "Not confirmed"}
              />
            </div>
          </GlassCard>

          <GlassCard animate delay={0.2} variant="elevated" className="p-6">
            <div>
              <h2 className="font-display font-semibold text-foreground">
                Child Information
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Measurements and submitted health details used in this assessment.
              </p>
            </div>
            <div className="mt-5 rounded-2xl border border-border/50 bg-background/30 p-4">
              <ReportRow label="Age At Assessment" value={`${a.age} months`} />
              <ReportRow label="Height" value={`${a.height} cm`} />
              <ReportRow label="Weight" value={`${a.weight} kg`} />
              <ReportRow label="Dietary Risk" value={`${a.dietaryScore}/100`} />
              <ReportRow label="Diet Diversity" value={`${a.dietDiversity}/10`} />
              <ReportRow
                label="Water Source"
                value={WATER_SOURCE_COPY[a.waterSource] ?? "Unknown"}
              />
            </div>
          </GlassCard>
        </div>

        <GlassCard animate delay={0.24} variant="elevated" className="p-6">
          <h2 className="font-display font-semibold text-foreground">
            Guidance
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Recommendations and practical next steps for follow-up care at home and with a health worker.
          </p>
          <div className="mt-5 space-y-5">
            <div data-ocid="recommendations-list">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Recommendations
              </div>
              <ul className="mt-3 space-y-3">
                {recommendations.map((rec) => (
                  <li
                    key={rec.title}
                    className="rounded-2xl border border-border/40 bg-background/25 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-foreground">
                        {rec.title}
                      </div>
                      <span className="rounded-full border border-border/50 bg-background/40 px-2 py-0.5 text-[10px] font-medium text-foreground">
                        {rec.priority === "high"
                          ? "High priority"
                          : rec.priority === "medium"
                            ? "Medium priority"
                            : "Good practice"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {rec.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div data-ocid="improvement-tips">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Improvement Suggestions
              </div>
              <div className="mt-3 space-y-4">
                {IMPROVEMENT_TIPS.map((tip) => (
                  <div
                    key={tip.id}
                    className="rounded-2xl border border-border/40 bg-background/25 px-4 py-3"
                  >
                    <div className="text-sm font-medium text-foreground">
                      {tip.title}
                    </div>
                    <ul className="mt-2 space-y-2">
                      {tip.tips.map((item) => (
                        <li
                          key={item}
                          className="text-sm leading-relaxed text-muted-foreground"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard animate delay={0.2} variant="default" className="p-4">
          <div
            className="grid grid-cols-2 gap-3"
            data-ocid="action-buttons-row"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-border/60 [&_span:first-child]:hidden"
              onClick={handleDownloadPDF}
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
              Set Reminder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-primary hover:text-primary [&_span:first-child]:hidden"
              onClick={() => navigate({ to: "/history" })}
              data-ocid="view-history-btn"
            >
              <span>📈</span> Growth History
            </Button>
            <Button
              size="sm"
              className="gap-2 text-xs gradient-teal text-primary-foreground border-0 [&_span:first-child]:hidden"
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
