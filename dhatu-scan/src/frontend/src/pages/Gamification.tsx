import GlassCard from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";
import type { Badge } from "@/types/index";
import {
  ALL_BADGES,
  LEVELS,
  getLevel,
  getLevelProgress,
} from "@/utils/assessmentLogic";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  ChevronRight,
  Lock,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Precomputed confetti data to avoid recreating on each render
const CONFETTI_DATA = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 2.57 + 7) % 100,
  delay: (i * 0.063) % 0.8,
  duration: 1.2 + ((i * 0.031) % 1.2),
  size: 6 + ((i * 0.2) % 8),
  color: ["#14b8a6", "#22c55e", "#3b82f6", "#a855f7", "#f59e0b"][i % 5],
  spin: i % 2 === 0 ? 360 : -360,
}));

const AVATAR_STAGES = {
  1: {
    shirt: "#ef4444",
    shirtShadow: "#dc2626",
    accent: "#fca5a5",
    scale: 0.92,
  },
  2: {
    shirt: "#f59e0b",
    shirtShadow: "#d97706",
    accent: "#fcd34d",
    scale: 1,
  },
  3: {
    shirt: "#22c55e",
    shirtShadow: "#16a34a",
    accent: "#86efac",
    scale: 1.08,
  },
} as const;

function StageAvatar({
  level,
  size = 64,
}: {
  level: number;
  size?: number;
}) {
  const stage = AVATAR_STAGES[level as keyof typeof AVATAR_STAGES] ?? AVATAR_STAGES[1];
  const ring = Math.max(2, Math.round(size * 0.035));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Avatar for ${LEVELS[level - 1]?.name ?? "progress stage"}`}
    >
      <defs>
        <linearGradient id={`avatar-bg-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stage.accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={stage.shirt} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill={`url(#avatar-bg-${level})`} opacity="0.16" />
      <circle
        cx="60"
        cy="60"
        r={56 - ring / 2}
        fill="none"
        stroke={stage.accent}
        strokeWidth={ring}
        opacity="0.7"
      />
      <g transform={`translate(60 63) scale(${stage.scale}) translate(-60 -63)`}>
        <ellipse cx="60" cy="98" rx="24" ry="8" fill="#0f172a" opacity="0.16" />
        <path
          d="M38 90C38 74 48 64 60 64C72 64 82 74 82 90V96H38V90Z"
          fill={stage.shirt}
        />
        <path
          d="M46 96C47 86 53 80 60 80C67 80 73 86 74 96H46Z"
          fill={stage.shirtShadow}
          opacity="0.22"
        />
        <rect x="54" y="54" width="12" height="16" rx="6" fill="#f2c5a0" />
        <ellipse cx="60" cy="42" rx="24" ry="26" fill="#f4c9a6" />
        <path
          d="M36 42C36 26 46 18 60 18C74 18 84 26 84 42V46C81 39 76 34 68 31C59 27 50 29 42 36L36 42Z"
          fill="#1f2937"
        />
        <circle cx="51" cy="44" r="2.8" fill="#1f2937" />
        <circle cx="69" cy="44" r="2.8" fill="#1f2937" />
        <path
          d="M53 54C56 58 64 58 67 54"
          fill="none"
          stroke="#9a3412"
          strokeLinecap="round"
          strokeWidth="2.6"
        />
        <circle cx="86" cy="33" r="8" fill={stage.accent} opacity="0.9" />
        <path
          d="M86 27L87.8 31.6L92.8 32L88.9 35.2L90.1 40L86 37.2L81.9 40L83.1 35.2L79.2 32L84.2 31.6L86 27Z"
          fill="#fff7ed"
        />
      </g>
    </svg>
  );
}

// ─── Confetti particle ──────────────────────────────────────────────────────
function ConfettiParticle({ index }: { index: number }) {
  const d = CONFETTI_DATA[index];
  return (
    <motion.div
      className="absolute top-0 rounded-sm pointer-events-none"
      style={{
        left: `${d.left}%`,
        width: d.size,
        height: d.size,
        backgroundColor: d.color,
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: 300, opacity: 0, rotate: d.spin }}
      transition={{ duration: d.duration, delay: d.delay }}
    />
  );
}

// ─── Level track node ────────────────────────────────────────────────────────
function LevelNode({
  levelInfo,
  isActive,
  isCompleted,
  index,
}: {
  levelInfo: (typeof LEVELS)[number];
  isActive: boolean;
  isCompleted: boolean;
  index: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 flex-1"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <motion.div
        className={cn(
          "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-smooth overflow-hidden",
          isActive
            ? "border-primary shadow-lg bg-primary/20"
            : isCompleted
              ? "border-accent bg-accent/20"
              : "border-border bg-muted/30 opacity-50",
        )}
        animate={isActive ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        <StageAvatar level={levelInfo.level} size={40} />
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        )}
        {isCompleted && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
            <Star className="w-2.5 h-2.5 text-accent-foreground" />
          </div>
        )}
      </motion.div>
      <span
        className={cn(
          "text-xs font-medium text-center leading-tight",
          isActive
            ? "text-primary"
            : isCompleted
              ? "text-accent"
              : "text-muted-foreground",
        )}
      >
        {levelInfo.name}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {levelInfo.minXP === 0 ? "Start" : `${levelInfo.minXP} XP`}
      </span>
    </motion.div>
  );
}

// ─── Badge card ───────────────────────────────────────────────────────────────
function BadgeCard({
  badge,
  index,
  onSelect,
}: {
  badge: Badge;
  index: number;
  onSelect: (b: Badge) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(badge)}
      className={cn(
        "relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-smooth",
        badge.unlocked
          ? "glass-card border-primary/30 hover:border-primary/60 cursor-pointer"
          : "border-border/30 bg-muted/10 opacity-40 cursor-not-allowed",
      )}
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: badge.unlocked ? 1 : 0.4, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={badge.unlocked ? { y: -2, scale: 1.03 } : {}}
      data-ocid={`badge-card-${badge.id}`}
    >
      {badge.unlocked && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, oklch(0.72 0.18 176 / 0.15) 0%, transparent 70%)",
          }}
        />
      )}

      <span className="text-2xl leading-none">{badge.icon}</span>
      <span
        className={cn(
          "text-[11px] font-semibold text-center leading-tight",
          badge.unlocked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {badge.name}
      </span>

      {badge.unlocked ? (
        <span className="text-[10px] text-accent font-medium">
          +{badge.xpReward} XP
        </span>
      ) : (
        <Lock className="w-3 h-3 text-muted-foreground" />
      )}
    </motion.button>
  );
}

// ─── Badge detail modal ───────────────────────────────────────────────────────
function BadgeModal({
  badge,
  onClose,
}: {
  badge: Badge | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {badge && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-80 z-50"
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard
              variant="elevated"
              glow="teal"
              className="p-6 text-center"
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 rounded-full glass-effect flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth"
                aria-label="Close"
              >
                ×
              </button>
              <div className="text-5xl mb-3">{badge.icon}</div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {badge.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {badge.description}
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full font-medium",
                    badge.unlocked
                      ? "bg-accent/20 text-accent"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {badge.unlocked ? "✓ Unlocked" : "🔒 Locked"}
                </span>
                <span className="text-primary font-semibold">
                  +{badge.xpReward} XP
                </span>
              </div>
              {badge.unlocked && badge.unlockedAt && (
                <p className="text-xs text-muted-foreground mt-3">
                  Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Gamification() {
  const { activeChild } = useApp();
  const { gamification, levelProgress } = useGamification();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(false);

  const currentLevel = getLevel(gamification.xp);
  const unlockedBadges = gamification.badges.filter((b) => b.unlocked);
  const recentBadges = [...unlockedBadges]
    .filter((b) => b.unlockedAt)
    .sort(
      (a, b) =>
        new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime(),
    )
    .slice(0, 3);

  // Merge ALL_BADGES with gamification state for display
  const displayBadges: Badge[] = ALL_BADGES.map((template) => {
    const existing = gamification.badges.find((b) => b.id === template.id);
    return existing ?? { ...template, unlocked: false };
  });

  // Checkup reminder
  const lastCheckup = gamification.lastCheckupDate
    ? new Date(gamification.lastCheckupDate)
    : new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
  const nextCheckup = new Date(
    lastCheckup.getTime() + 30 * 24 * 60 * 60 * 1000,
  );
  const daysUntilCheckup = Math.max(
    0,
    Math.ceil((nextCheckup.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );
  const checkupOverdue = daysUntilCheckup === 0;

  // Trigger confetti once if badges recently unlocked
  useEffect(() => {
    if (!confettiRef.current && unlockedBadges.length > 0) {
      confettiRef.current = true;
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [unlockedBadges.length]);

  const xpInCurrentLevel = gamification.xp - currentLevel.minXP;
  const xpNeeded =
    currentLevel.nextLevelXP === Number.POSITIVE_INFINITY
      ? gamification.xp
      : currentLevel.nextLevelXP - currentLevel.minXP;

  // Level track fill width as percentage
  const trackFillPct = Math.min(
    100,
    ((currentLevel.level - 1) / (LEVELS.length - 1)) * 100 +
      (getLevelProgress(gamification.xp) / 100) *
        (1 / (LEVELS.length - 1)) *
        100,
  );

  return (
    <div className="min-h-screen gradient-hero pb-24 md:pb-8">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 40 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: confetti decorative
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      <BadgeModal
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* Page header */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center glow-teal">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-gradient-health">
              Progress &amp; Rewards
            </h1>
            <p className="text-xs text-muted-foreground">
              Track your child's health journey
            </p>
          </div>
        </motion.div>

        {/* ── Hero card: Avatar + Level ───────────────────────────────── */}
        <GlassCard
          variant="elevated"
          glow="teal"
          animate
          delay={0.05}
          className="p-6"
        >
          <div className="flex flex-col items-center text-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-full gradient-teal glow-teal flex items-center justify-center shadow-xl overflow-hidden"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              >
                <StageAvatar level={currentLevel.level} size={88} />
              </motion.div>
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-health border-2 border-background flex items-center justify-center shadow-md">
                <span className="text-xs font-bold text-white">
                  {currentLevel.level}
                </span>
              </div>
            </div>

            {/* Name + level */}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {activeChild?.name ?? "Your Child"}
              </h2>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mt-2">
                Care Stage
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-lg font-semibold text-gradient-teal">
                  {currentLevel.name}
                </span>
              </div>
            </div>

            {/* XP Display */}
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">
                  XP Progress
                </span>
                <span className="text-primary font-bold">
                  {xpInCurrentLevel} / {xpNeeded} XP
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-teal"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Total: {gamification.xp} XP</span>
                {currentLevel.nextLevelXP !== Number.POSITIVE_INFINITY && (
                  <span>Next: {currentLevel.nextLevelXP} XP</span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 w-full pt-2 border-t border-border/40">
              {[
                { label: "Checkups", value: gamification.checkups },
                { label: "Streak", value: `${gamification.streak}mo` },
                { label: "Badges", value: unlockedBadges.length },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* ── Level Track ────────────────────────────────────────────── */}
        <GlassCard variant="default" animate delay={0.1} className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Recovery Journey
          </h3>
          <div className="relative flex items-start justify-between">
            {/* Track line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-border z-0" />
            <motion.div
              className="absolute top-6 left-0 h-0.5 gradient-teal z-0"
              initial={{ width: 0 }}
              animate={{ width: `${trackFillPct}%` }}
              transition={{ duration: 1, delay: 0.4 }}
            />
            {LEVELS.map((lvl, i) => (
              <LevelNode
                key={lvl.level}
                levelInfo={lvl}
                isActive={lvl.level === currentLevel.level}
                isCompleted={lvl.level < currentLevel.level}
                index={i}
              />
            ))}
          </div>
        </GlassCard>

        {/* ── Badge Collection ───────────────────────────────────────── */}
        <GlassCard variant="default" animate delay={0.15} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              🏅 Badge Collection
            </h3>
            <span className="text-xs text-primary font-medium">
              {unlockedBadges.length}/{displayBadges.length} Unlocked
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {displayBadges.map((badge, i) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                index={i}
                onSelect={setSelectedBadge}
              />
            ))}
          </div>
        </GlassCard>

        {/* ── Recent Achievements ────────────────────────────────────── */}
        {recentBadges.length > 0 && (
          <GlassCard variant="default" animate delay={0.2} className="p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              🎉 Recent Achievements
            </h3>
            <div className="space-y-3">
              {recentBadges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  className="flex items-center gap-3 p-3 rounded-lg glass-effect-dark border border-border/30"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                >
                  <div className="w-10 h-10 rounded-full gradient-health flex items-center justify-center text-xl flex-shrink-0">
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {badge.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {badge.unlockedAt
                        ? new Date(badge.unlockedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "Recently unlocked"}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-accent flex-shrink-0">
                    +{badge.xpReward} XP
                  </span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* ── Monthly Checkup Reminder ───────────────────────────────── */}
        <GlassCard
          variant="elevated"
          glow={checkupOverdue ? "green" : "none"}
          animate
          delay={0.25}
          className="p-5"
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                checkupOverdue ? "gradient-health glow-green" : "gradient-teal",
              )}
            >
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-base font-bold text-foreground">
                  Monthly Checkup
                </h3>
                {checkupOverdue ? (
                  <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium">
                    Overdue
                  </span>
                ) : (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    {daysUntilCheckup}d left
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {checkupOverdue
                  ? "Your monthly checkup is overdue. Schedule now to earn bonus XP!"
                  : `Next checkup due ${nextCheckup.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-accent font-semibold">
                  🎁 +50 Bonus XP on completion
                </span>
                <Link
                  to="/form"
                  className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-smooth"
                  data-ocid="checkup-schedule-btn"
                >
                  Start <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Community Leaderboard Teaser ───────────────────────────── */}
        <GlassCard variant="subtle" animate delay={0.3} className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              🏆
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Community Rank
              </h3>
              <p className="text-xs text-muted-foreground">
                Your regional standing
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg glass-effect-dark border border-border/30 mb-3">
            <div>
              <p className="text-lg font-bold text-gradient-teal">Top 15%</p>
              <p className="text-xs text-muted-foreground">in your region</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {gamification.xp} XP
              </p>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/10">
            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">
                Full Leaderboard
              </p>
              <p className="text-xs text-muted-foreground">
                Coming soon — compare with caregivers nationwide
              </p>
            </div>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
              Soon
            </span>
          </div>
        </GlassCard>

        {/* ── XP breakdown hints ─────────────────────────────────────── */}
        <GlassCard variant="subtle" animate delay={0.35} className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Earn More XP
          </h3>
          <div className="space-y-2">
            {[
              { action: "Complete an assessment", xp: 50, icon: "📋" },
              { action: "Use camera analysis", xp: 20, icon: "📷" },
              { action: "Child scores Low Risk", xp: 30, icon: "💚" },
              { action: "Monthly checkup on time", xp: 50, icon: "📅" },
              { action: "Unlock a badge", xp: "varies", icon: "🏅" },
            ].map((item, i) => (
              <motion.div
                key={item.action}
                className="flex items-center justify-between gap-3 py-2 border-b border-border/20 last:border-0"
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-foreground">{item.action}</span>
                </div>
                <span className="text-xs font-bold text-primary">
                  +{item.xp} XP
                </span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

