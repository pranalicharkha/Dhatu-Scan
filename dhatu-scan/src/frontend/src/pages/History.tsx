import GlassCard from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import { deleteAssessmentRecord } from "@/data/assessmentRepository";
import type { Assessment, ChildProfile } from "@/types/index";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Filter,
  Minus,
  Ruler,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getMonthLabel(iso: string): string {
  const d = new Date(iso);
  return `${MONTH_LABELS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function getRiskColor(level: string): string {
  if (level === "low")
    return "text-emerald-400 bg-emerald-400/15 border-emerald-400/30";
  if (level === "moderate")
    return "text-amber-400 bg-amber-400/15 border-amber-400/30";
  return "text-red-400 bg-red-400/15 border-red-400/30";
}

function getRiskLabel(level: string): string {
  if (level === "low") return "Low Risk";
  if (level === "moderate") return "Moderate Risk";
  return "High Risk";
}

function getWHOColor(status: string): string {
  if (status === "normal")
    return "text-emerald-400 bg-emerald-400/10 border-emerald-400/25";
  if (status === "underweight")
    return "text-amber-400 bg-amber-400/10 border-amber-400/25";
  if (status === "severe_underweight")
    return "text-orange-400 bg-orange-400/10 border-orange-400/25";
  if (status === "stunted")
    return "text-orange-400 bg-orange-400/10 border-orange-400/25";
  if (status === "severe_stunting")
    return "text-red-400 bg-red-400/10 border-red-400/25";
  if (status === "wasted")
    return "text-rose-400 bg-rose-400/10 border-rose-400/25";
  return "text-red-400 bg-red-400/10 border-red-400/25";
}

function getWHOLabel(status: string): string {
  if (status === "normal") return "Normal";
  if (status === "underweight") return "Underweight";
  if (status === "severe_underweight") return "Severe Underweight";
  if (status === "stunted") return "Stunted";
  if (status === "severe_stunting") return "Severe Stunting";
  if (status === "wasted") return "Wasted";
  return "Severe Wasting";
}

// Custom glass tooltip for recharts
function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 border border-white/15 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p
          key={p.name}
          className="text-sm font-medium"
          style={{ color: p.color }}
        >
          {p.name}:{" "}
          <span className="font-bold">
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function AssessmentCard({
  assessment,
  childName,
  onDelete,
  index,
}: {
  assessment: Assessment;
  childName: string;
  onDelete: (id: string) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <GlassCard
        hover
        className="p-0 overflow-hidden"
        data-ocid={`assessment-card-${assessment.id}`}
      >
        {/* Header row */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-3 p-4 text-left"
          aria-expanded={expanded}
          aria-label={`Assessment for ${childName} on ${formatDate(assessment.date)}`}
        >
          {/* Date + child */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {childName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(assessment.date)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {/* Risk badge */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getRiskColor(assessment.riskLevel)}`}
              >
                {getRiskLabel(assessment.riskLevel)}
              </span>
              {/* WHO status */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${getWHOColor(assessment.whoStatus)}`}
              >
                {getWHOLabel(assessment.whoStatus)}
              </span>
            </div>
          </div>

          {/* Score pill */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-lg font-bold text-gradient-teal">
              {assessment.finalScore}
            </div>
            <div className="text-xs text-muted-foreground">Final Score</div>
          </div>

          {/* Chevron */}
          <div className="text-muted-foreground ml-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {/* Expanded details */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-white/8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {[
                    {
                      label: "HAZ",
                      value: (assessment.haz ?? assessment.whoZScore).toFixed(2),
                      unit: "",
                    },
                    {
                      label: "WHZ",
                      value: (assessment.whz ?? assessment.whoZScore).toFixed(2),
                      unit: "",
                    },
                    {
                      label: "BMI",
                      value: (
                        assessment.weight /
                        (assessment.height / 100) ** 2
                      ).toFixed(1),
                      unit: "",
                    },
                    {
                      label: "Height",
                      value: `${assessment.height}`,
                      unit: "cm",
                    },
                    {
                      label: "Weight",
                      value: `${assessment.weight}`,
                      unit: "kg",
                    },
                    {
                      label: "Diet Div.",
                      value: `${assessment.dietDiversity}`,
                      unit: "/10",
                    },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="bg-white/5 rounded-lg p-2.5">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        {label}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {value}
                        <span className="text-xs text-muted-foreground font-normal">
                          {unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delete */}
                <div className="flex justify-end mt-3">
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">
                        Confirm delete?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(assessment.id);
                          setConfirmDelete(false);
                        }}
                        className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-smooth"
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs px-3 py-1.5 bg-white/5 text-muted-foreground border border-white/10 rounded-lg hover:bg-white/10 transition-smooth"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      aria-label="Delete assessment"
                      data-ocid="delete-assessment-btn"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-smooth px-2 py-1.5 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

function TimelineItem({
  current,
  previous,
  date,
  childName,
  index,
}: {
  current: Assessment;
  previous: Assessment | null;
  date: string;
  childName: string;
  index: number;
}) {
  const diff = previous ? current.finalScore - previous.finalScore : 0;
  const isFirst = !previous;
  const isImproved = diff < -3;
  const isWorsened = diff > 3;

  const dotColor = isFirst
    ? "bg-primary border-primary/50"
    : isImproved
      ? "bg-emerald-400 border-emerald-400/50"
      : isWorsened
        ? "bg-red-400 border-red-400/50"
        : "bg-muted-foreground border-muted-foreground/50";

  const Icon = isImproved ? TrendingUp : isWorsened ? TrendingDown : Minus;
  const iconColor = isFirst
    ? "text-primary"
    : isImproved
      ? "text-emerald-400"
      : isWorsened
        ? "text-red-400"
        : "text-muted-foreground";

  return (
    <motion.div
      className="flex gap-3 items-start"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center mt-1 shrink-0">
        <div className={`w-3 h-3 rounded-full border-2 ${dotColor}`} />
        <div
          className="w-px flex-1 bg-white/10 mt-1"
          style={{ minHeight: 24 }}
        />
      </div>
      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-sm font-medium text-foreground">
              {childName}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {formatDate(date)}
            </span>
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-medium ${iconColor}`}
          >
            <Icon size={12} />
            {isFirst
              ? "First assessment"
              : Math.abs(diff) < 1
                ? "Stable"
                : `${isImproved ? "↓" : "↑"}${Math.abs(diff)} pts`}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Score: {current.finalScore} · {getWHOLabel(current.whoStatus)} · Z:{" "}
          {current.whoZScore.toFixed(1)}
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
        <ClipboardList size={36} className="text-primary/70" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Assessments Yet
      </h3>
      <p className="text-muted-foreground max-w-xs mb-6 text-sm leading-relaxed">
        Growth history will appear here once you complete your first assessment.
        Start tracking today!
      </p>
      <a
        href="/form"
        data-ocid="empty-start-assessment-cta"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-teal text-white font-medium text-sm hover:opacity-90 transition-smooth shadow-lg"
      >
        <Activity size={16} />
        Start First Assessment
      </a>
    </motion.div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function History() {
  const { state } = useApp();
  const { assessments, children } = state;

  const [selectedChild, setSelectedChild] = useState<string>("all");
  const [monthRange, setMonthRange] = useState<number>(6);
  const [localAssessments, setLocalAssessments] =
    useState<Assessment[]>(assessments);

  // Sync when context updates
  useEffect(() => {
    setLocalAssessments(assessments);
  }, [assessments]);

  // Filtered by child
  const childFiltered = useMemo(() => {
    if (selectedChild === "all") return localAssessments;
    return localAssessments.filter((a) => a.childId === selectedChild);
  }, [localAssessments, selectedChild]);

  // Filtered by date range
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthRange);
    return d.getTime();
  }, [monthRange]);

  const filtered = useMemo(() => {
    return childFiltered
      .filter((a) => new Date(a.date).getTime() >= cutoff)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [childFiltered, cutoff]);

  // Build chart data by month
  const chartData = useMemo(() => {
    const byMonth: Record<
      string,
      { zScores: number[]; weights: number[]; heights: number[] }
    > = {};

    for (const a of filtered) {
      const key = getMonthLabel(a.date);
      if (!byMonth[key])
        byMonth[key] = { zScores: [], weights: [], heights: [] };
      byMonth[key].zScores.push(a.haz ?? a.whoZScore);
      byMonth[key].weights.push(a.weight);
      byMonth[key].heights.push(a.height);
    }

    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

    return Object.entries(byMonth)
      .map(([month, d]) => ({
        month,
        zScore: Number(avg(d.zScores).toFixed(2)),
        weight: Number(avg(d.weights).toFixed(1)),
        height: Number(avg(d.heights).toFixed(1)),
      }))
      .reverse();
  }, [filtered]);

  // Timeline (chronological asc)
  const timelineItems = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sorted.map((a, i) => ({
      current: a,
      previous: i > 0 ? sorted[i - 1] : null,
      childName:
        children.find((c: ChildProfile) => c.id === a.childId)?.name ??
        "Unknown",
    }));
  }, [filtered, children]);

  const handleDelete = (id: string) => {
    void deleteAssessmentRecord(id);
    setLocalAssessments((prev) => prev.filter((a) => a.id !== id));
  };

  const hasData = filtered.length > 0;
  const hasChartData = chartData.length > 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-white/8 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-gradient-teal">
              Growth History
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track progress over time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary font-medium">
              {filtered.length} assessments
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Filter bar ── */}
        <GlassCard animate delay={0} className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter size={15} className="text-muted-foreground shrink-0" />

            {/* Child filter */}
            <div className="relative">
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                data-ocid="child-filter-select"
                className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/8 border border-white/12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
              >
                <option value="all">All Children</option>
                {children.map((c: ChildProfile) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>

            {/* Month range filter */}
            <div className="relative">
              <select
                value={monthRange}
                onChange={(e) => setMonthRange(Number(e.target.value))}
                data-ocid="month-range-filter"
                className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/8 border border-white/12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 1 year</option>
              </select>
              <Calendar
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>

            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity size={13} />
              {filtered.length} of {localAssessments.length} total
            </div>
          </div>
        </GlassCard>

        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Charts row ── */}
            {hasChartData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Z-Score Area Chart */}
                <GlassCard animate delay={0.05} className="p-4 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Activity size={14} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        WHO HAZ Trend
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Height-for-age z-score over time
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-px bg-amber-400 inline-block" />{" "}
                        -2 Stunting
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-px bg-red-400 inline-block" /> -3
                        Severe
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={chartData}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="zScoreGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="oklch(0.72 0.18 176)"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="oklch(0.72 0.18 176)"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "oklch(0.58 0.02 240)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[-4, 3]}
                        tick={{ fontSize: 11, fill: "oklch(0.58 0.02 240)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<GlassTooltip />} />
                      <ReferenceLine
                        y={-2}
                        stroke="oklch(0.78 0.16 100)"
                        strokeDasharray="4 3"
                        strokeWidth={1.5}
                        label={{
                          value: "-2",
                          position: "right",
                          fontSize: 10,
                          fill: "oklch(0.78 0.16 100)",
                        }}
                      />
                      <ReferenceLine
                        y={-3}
                        stroke="oklch(0.65 0.19 22)"
                        strokeDasharray="4 3"
                        strokeWidth={1.5}
                        label={{
                          value: "-3",
                          position: "right",
                          fontSize: 10,
                          fill: "oklch(0.65 0.19 22)",
                        }}
                      />
                      <ReferenceLine
                        y={0}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth={1}
                      />
                      <Area
                        type="monotone"
                        dataKey="zScore"
                        name="HAZ"
                        stroke="oklch(0.72 0.18 176)"
                        strokeWidth={2.5}
                        fill="url(#zScoreGrad)"
                        dot={{
                          r: 4,
                          fill: "oklch(0.72 0.18 176)",
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 6,
                          fill: "oklch(0.72 0.18 176)",
                          stroke: "rgba(255,255,255,0.3)",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>

                {/* Weight Chart */}
                <GlassCard animate delay={0.1} className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                      <Scale size={14} className="text-accent" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        Weight Progress
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Kilograms over time
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "oklch(0.58 0.02 240)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "oklch(0.58 0.02 240)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<GlassTooltip />} />
                      <Legend
                        wrapperStyle={{
                          fontSize: 11,
                          color: "oklch(0.58 0.02 240)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        name="Weight (kg)"
                        stroke="oklch(0.7 0.19 155)"
                        strokeWidth={2.5}
                        dot={{
                          r: 4,
                          fill: "oklch(0.7 0.19 155)",
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 6,
                          fill: "oklch(0.7 0.19 155)",
                          stroke: "rgba(255,255,255,0.3)",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </GlassCard>

                {/* Height Chart */}
                <GlassCard animate delay={0.15} className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-secondary/15 flex items-center justify-center">
                      <Ruler size={14} className="text-secondary" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        Height Progress
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Centimeters over time
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "oklch(0.58 0.02 240)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "oklch(0.58 0.02 240)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<GlassTooltip />} />
                      <Legend
                        wrapperStyle={{
                          fontSize: 11,
                          color: "oklch(0.58 0.02 240)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="height"
                        name="Height (cm)"
                        stroke="oklch(0.6 0.15 235)"
                        strokeWidth={2.5}
                        dot={{
                          r: 4,
                          fill: "oklch(0.6 0.15 235)",
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 6,
                          fill: "oklch(0.6 0.15 235)",
                          stroke: "rgba(255,255,255,0.3)",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </GlassCard>
              </div>
            )}

            {/* ── Assessment list + Timeline ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Assessment cards — 2/3 width */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-foreground">
                    Past Assessments
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    newest first
                  </span>
                </div>
                {filtered.map((a, i) => (
                  <AssessmentCard
                    key={a.id}
                    assessment={a}
                    childName={
                      children.find((c: ChildProfile) => c.id === a.childId)
                        ?.name ?? "Unknown"
                    }
                    onDelete={handleDelete}
                    index={i}
                  />
                ))}
              </div>

              {/* Improvement timeline — 1/3 width */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-base font-semibold text-foreground">
                    Improvement Timeline
                  </h2>
                </div>
                <GlassCard animate delay={0.2} className="p-4">
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                      Improved
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                      Worsened
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground inline-block" />
                      Stable
                    </span>
                  </div>

                  <div className="space-y-0">
                    {timelineItems.map((item, i) => (
                      <TimelineItem
                        key={item.current.id}
                        current={item.current}
                        previous={item.previous}
                        date={item.current.date}
                        childName={item.childName}
                        index={i}
                      />
                    ))}
                  </div>

                  {/* Risk distribution summary */}
                  <div className="mt-4 pt-4 border-t border-white/8">
                    <p className="text-xs text-muted-foreground mb-2">
                      Risk distribution
                    </p>
                    <div className="flex gap-2">
                      {(["low", "moderate", "high"] as const).map((level) => {
                        const count = filtered.filter(
                          (a) => a.riskLevel === level,
                        ).length;
                        const pct = filtered.length
                          ? Math.round((count / filtered.length) * 100)
                          : 0;
                        return (
                          <div key={level} className="flex-1 text-center">
                            <div
                              className={`text-sm font-bold ${level === "low" ? "text-emerald-400" : level === "moderate" ? "text-amber-400" : "text-red-400"}`}
                            >
                              {pct}%
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {level}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Bar */}
                    <div className="flex rounded-full overflow-hidden h-1.5 mt-2 gap-px">
                      {(["low", "moderate", "high"] as const).map((level) => {
                        const count = filtered.filter(
                          (a) => a.riskLevel === level,
                        ).length;
                        const pct = filtered.length
                          ? (count / filtered.length) * 100
                          : 0;
                        const bg =
                          level === "low"
                            ? "bg-emerald-400"
                            : level === "moderate"
                              ? "bg-amber-400"
                              : "bg-red-400";
                        return pct > 0 ? (
                          <div
                            key={level}
                            className={`${bg} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                </GlassCard>

                {/* Quick stats */}
                <GlassCard
                  animate
                  delay={0.25}
                  className="hidden p-4 mt-4"
                  aria-hidden="true"
                >
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Quick Stats
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Avg HAZ",
                        value: filtered.length
                          ? (
                              filtered.reduce((s, a) => s + (a.haz ?? a.whoZScore), 0) /
                              filtered.length
                            ).toFixed(2)
                          : "—",
                        icon: <Activity size={13} />,
                        color: "text-primary",
                      },
                      {
                        label: "Avg Final Score",
                        value: filtered.length
                          ? Math.round(
                              filtered.reduce((s, a) => s + a.finalScore, 0) /
                                filtered.length,
                            )
                          : "—",
                        icon: <CheckCircle size={13} />,
                        color: "text-accent",
                      },
                      {
                        label: "Highest Risk",
                        value: filtered.some((a) => a.riskLevel === "high")
                          ? "High"
                          : filtered.some((a) => a.riskLevel === "moderate")
                            ? "Moderate"
                            : "Low",
                        icon: <AlertTriangle size={13} />,
                        color: filtered.some((a) => a.riskLevel === "high")
                          ? "text-red-400"
                          : filtered.some((a) => a.riskLevel === "moderate")
                            ? "text-amber-400"
                            : "text-emerald-400",
                      },
                      {
                        label: "Children tracked",
                        value: new Set(filtered.map((a) => a.childId)).size,
                        icon: <AlertCircle size={13} />,
                        color: "text-secondary",
                      },
                    ].map(({ label, value, icon, color }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <div
                          className={`flex items-center gap-1.5 text-xs text-muted-foreground ${color}`}
                        >
                          {icon}
                          {label}
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
