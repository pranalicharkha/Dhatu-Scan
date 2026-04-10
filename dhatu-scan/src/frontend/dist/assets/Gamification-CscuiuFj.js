import { c as createLucideIcon, a as useApp, B as getLevelProgress, r as reactExports, D as ALL_BADGES, E as getLevel, F as saveGamificationState, G as LEVELS, j as jsxRuntimeExports, m as motion, l as cn, L as Link, S as Star, A as AnimatePresence } from "./index-BzFT_KhA.js";
import { G as GlassCard } from "./GlassCard-BSN70r43.js";
import { C as Calendar } from "./calendar-D06CshlX.js";
import { L as Lock } from "./lock-CHee1eis.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]];
const ChevronRight = createLucideIcon("chevron-right", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
      key: "4pj2yx"
    }
  ],
  ["path", { d: "M20 3v4", key: "1olli1" }],
  ["path", { d: "M22 5h-4", key: "1gvqau" }],
  ["path", { d: "M4 17v2", key: "vumght" }],
  ["path", { d: "M5 18H3", key: "zchphs" }]
];
const Sparkles = createLucideIcon("sparkles", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6", key: "17hqa7" }],
  ["path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18", key: "lmptdp" }],
  ["path", { d: "M4 22h16", key: "57wxv0" }],
  ["path", { d: "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22", key: "1nw9bq" }],
  ["path", { d: "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22", key: "1np0yb" }],
  ["path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2Z", key: "u46fv3" }]
];
const Trophy = createLucideIcon("trophy", __iconNode);
function useGamification() {
  const { state, awardXP: contextAwardXP } = useApp();
  const { gamification } = state;
  const levelProgress = getLevelProgress(gamification.xp);
  const awardXP = reactExports.useCallback(
    (amount, _reason) => {
      contextAwardXP(amount);
    },
    [contextAwardXP]
  );
  const unlockBadge = reactExports.useCallback(
    (badgeId) => {
      const existing = gamification.badges.find((b) => b.id === badgeId);
      if (existing == null ? void 0 : existing.unlocked) return null;
      const badgeTemplate = ALL_BADGES.find((b) => b.id === badgeId);
      if (!badgeTemplate) return null;
      const newBadge = {
        ...badgeTemplate,
        unlocked: true,
        unlockedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const updatedBadges = gamification.badges.map(
        (b) => b.id === badgeId ? newBadge : b
      );
      if (!gamification.badges.find((b) => b.id === badgeId)) {
        updatedBadges.push(newBadge);
      }
      const updated = {
        ...gamification,
        badges: updatedBadges,
        xp: gamification.xp + newBadge.xpReward
      };
      const levelInfo = getLevel(updated.xp);
      updated.level = levelInfo.level;
      updated.levelName = levelInfo.name;
      saveGamificationState(updated);
      return newBadge;
    },
    [gamification]
  );
  const checkAndUnlockBadges = reactExports.useCallback(() => {
    const unlocked = [];
    const { checkups, badges } = gamification;
    const isUnlocked = (id) => {
      var _a;
      return (_a = badges.find((b) => b.id === id)) == null ? void 0 : _a.unlocked;
    };
    if (checkups >= 1 && !isUnlocked("first_scan")) {
      const b = unlockBadge("first_scan");
      if (b) unlocked.push(b);
    }
    if (checkups >= 3 && !isUnlocked("three_checkups")) {
      const b = unlockBadge("three_checkups");
      if (b) unlocked.push(b);
    }
    if (checkups >= 6 && !isUnlocked("six_months")) {
      const b = unlockBadge("six_months");
      if (b) unlocked.push(b);
    }
    if (state.children.length >= 2 && !isUnlocked("multi_child")) {
      const b = unlockBadge("multi_child");
      if (b) unlocked.push(b);
    }
    return unlocked;
  }, [gamification, state.children.length, unlockBadge]);
  const getLevelInfo = reactExports.useCallback(
    () => getLevel(gamification.xp),
    [gamification.xp]
  );
  return {
    gamification,
    levelProgress,
    awardXP,
    unlockBadge,
    checkAndUnlockBadges,
    getLevelInfo
  };
}
const CONFETTI_DATA = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 2.57 + 7) % 100,
  delay: i * 0.063 % 0.8,
  duration: 1.2 + i * 0.031 % 1.2,
  size: 6 + i * 0.2 % 8,
  color: ["#14b8a6", "#22c55e", "#3b82f6", "#a855f7", "#f59e0b"][i % 5],
  spin: i % 2 === 0 ? 360 : -360
}));
function ConfettiParticle({ index }) {
  const d = CONFETTI_DATA[index];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      className: "absolute top-0 rounded-sm pointer-events-none",
      style: {
        left: `${d.left}%`,
        width: d.size,
        height: d.size,
        backgroundColor: d.color
      },
      initial: { y: -20, opacity: 1, rotate: 0 },
      animate: { y: 300, opacity: 0, rotate: d.spin },
      transition: { duration: d.duration, delay: d.delay }
    }
  );
}
function LevelNode({
  levelInfo,
  isActive,
  isCompleted,
  index
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      className: "flex flex-col items-center gap-1.5 flex-1",
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, delay: index * 0.1 },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            className: cn(
              "relative flex items-center justify-center w-12 h-12 rounded-full text-xl border-2 transition-smooth",
              isActive ? "border-primary shadow-lg bg-primary/20" : isCompleted ? "border-accent bg-accent/20" : "border-border bg-muted/30 opacity-50"
            ),
            animate: isActive ? { scale: [1, 1.08, 1] } : {},
            transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
            children: [
              levelInfo.icon,
              isActive && /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.div,
                {
                  className: "absolute inset-0 rounded-full border-2 border-primary",
                  animate: { scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] },
                  transition: { duration: 2, repeat: Number.POSITIVE_INFINITY }
                }
              ),
              isCompleted && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "w-2.5 h-2.5 text-accent-foreground" }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: cn(
              "text-xs font-medium text-center leading-tight",
              isActive ? "text-primary" : isCompleted ? "text-accent" : "text-muted-foreground"
            ),
            children: levelInfo.name
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: levelInfo.minXP === 0 ? "Start" : `${levelInfo.minXP} XP` })
      ]
    }
  );
}
function BadgeCard({
  badge,
  index,
  onSelect
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.button,
    {
      type: "button",
      onClick: () => onSelect(badge),
      className: cn(
        "relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-smooth",
        badge.unlocked ? "glass-card border-primary/30 hover:border-primary/60 cursor-pointer" : "border-border/30 bg-muted/10 opacity-40 cursor-not-allowed"
      ),
      initial: { opacity: 0, scale: 0.85 },
      whileInView: { opacity: badge.unlocked ? 1 : 0.4, scale: 1 },
      viewport: { once: true },
      transition: { duration: 0.35, delay: index * 0.05 },
      whileHover: badge.unlocked ? { y: -2, scale: 1.03 } : {},
      "data-ocid": `badge-card-${badge.id}`,
      children: [
        badge.unlocked && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-0 rounded-xl pointer-events-none",
            style: {
              background: "radial-gradient(circle at 50% 0%, oklch(0.72 0.18 176 / 0.15) 0%, transparent 70%)"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl leading-none", children: badge.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: cn(
              "text-[11px] font-semibold text-center leading-tight",
              badge.unlocked ? "text-foreground" : "text-muted-foreground"
            ),
            children: badge.name
          }
        ),
        badge.unlocked ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-accent font-medium", children: [
          "+",
          badge.xpReward,
          " XP"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-3 h-3 text-muted-foreground" })
      ]
    }
  );
}
function BadgeModal({
  badge,
  onClose
}) {
  reactExports.useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: badge && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-40",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        className: "fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-80 z-50",
        initial: { opacity: 0, y: 40, scale: 0.92 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 40, scale: 0.92 },
        transition: { duration: 0.3 },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          GlassCard,
          {
            variant: "elevated",
            glow: "teal",
            className: "p-6 text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  className: "absolute top-3 right-3 w-7 h-7 rounded-full glass-effect flex items-center justify-center text-muted-foreground hover:text-foreground transition-smooth",
                  "aria-label": "Close",
                  children: "×"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl mb-3", children: badge.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold text-foreground mb-1", children: badge.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: badge.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-4 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "px-3 py-1 rounded-full font-medium",
                      badge.unlocked ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                    ),
                    children: badge.unlocked ? "✓ Unlocked" : "🔒 Locked"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary font-semibold", children: [
                  "+",
                  badge.xpReward,
                  " XP"
                ] })
              ] }),
              badge.unlocked && badge.unlockedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-3", children: [
                "Unlocked ",
                new Date(badge.unlockedAt).toLocaleDateString()
              ] })
            ]
          }
        )
      }
    )
  ] }) });
}
function Gamification() {
  const { activeChild } = useApp();
  const { gamification, levelProgress } = useGamification();
  const [selectedBadge, setSelectedBadge] = reactExports.useState(null);
  const [showConfetti, setShowConfetti] = reactExports.useState(false);
  const confettiRef = reactExports.useRef(false);
  const currentLevel = getLevel(gamification.xp);
  const unlockedBadges = gamification.badges.filter((b) => b.unlocked);
  const recentBadges = [...unlockedBadges].filter((b) => b.unlockedAt).sort(
    (a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
  ).slice(0, 3);
  const displayBadges = ALL_BADGES.map((template) => {
    const existing = gamification.badges.find((b) => b.id === template.id);
    return existing ?? { ...template, unlocked: false };
  });
  const lastCheckup = gamification.lastCheckupDate ? new Date(gamification.lastCheckupDate) : new Date(Date.now() - 45 * 24 * 60 * 60 * 1e3);
  const nextCheckup = new Date(
    lastCheckup.getTime() + 30 * 24 * 60 * 60 * 1e3
  );
  const daysUntilCheckup = Math.max(
    0,
    Math.ceil((nextCheckup.getTime() - Date.now()) / (24 * 60 * 60 * 1e3))
  );
  const checkupOverdue = daysUntilCheckup === 0;
  reactExports.useEffect(() => {
    if (!confettiRef.current && unlockedBadges.length > 0) {
      confettiRef.current = true;
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [unlockedBadges.length]);
  const xpInCurrentLevel = gamification.xp - currentLevel.minXP;
  const xpNeeded = currentLevel.nextLevelXP === Number.POSITIVE_INFINITY ? gamification.xp : currentLevel.nextLevelXP - currentLevel.minXP;
  const trackFillPct = Math.min(
    100,
    (currentLevel.level - 1) / (LEVELS.length - 1) * 100 + getLevelProgress(gamification.xp) / 100 * (1 / (LEVELS.length - 1)) * 100
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen gradient-hero pb-24 md:pb-8", children: [
    showConfetti && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 pointer-events-none overflow-hidden z-50", children: Array.from({ length: 40 }).map((_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: confetti decorative
      /* @__PURE__ */ jsxRuntimeExports.jsx(ConfettiParticle, { index: i }, i)
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BadgeModal,
      {
        badge: selectedBadge,
        onClose: () => setSelectedBadge(null)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 pt-6 space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          className: "flex items-center gap-3",
          initial: { opacity: 0, y: -12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl gradient-teal flex items-center justify-center glow-teal", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "w-5 h-5 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold font-display text-gradient-health", children: "Progress & Rewards" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Track your child's health journey" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        GlassCard,
        {
          variant: "elevated",
          glow: "teal",
          animate: true,
          delay: 0.05,
          className: "p-6",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.div,
                {
                  className: "w-24 h-24 rounded-full gradient-teal glow-teal flex items-center justify-center text-4xl shadow-xl",
                  animate: { scale: [1, 1.04, 1] },
                  transition: { duration: 3, repeat: Number.POSITIVE_INFINITY },
                  children: currentLevel.icon
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-health border-2 border-background flex items-center justify-center shadow-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-white", children: currentLevel.level }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-foreground", children: (activeChild == null ? void 0 : activeChild.name) ?? "Your Child" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: currentLevel.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-semibold text-gradient-teal", children: currentLevel.name })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: "XP Progress" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary font-bold", children: [
                  xpInCurrentLevel,
                  " / ",
                  xpNeeded,
                  " XP"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.div,
                {
                  className: "h-full rounded-full gradient-teal",
                  initial: { width: 0 },
                  animate: { width: `${levelProgress}%` },
                  transition: { duration: 1, delay: 0.3 }
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Total: ",
                  gamification.xp,
                  " XP"
                ] }),
                currentLevel.nextLevelXP !== Number.POSITIVE_INFINITY && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Next: ",
                  currentLevel.nextLevelXP,
                  " XP"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3 w-full pt-2 border-t border-border/40", children: [
              { label: "Checkups", value: gamification.checkups },
              { label: "Streak", value: `${gamification.streak}mo` },
              { label: "Badges", value: unlockedBadges.length }
            ].map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold text-primary", children: stat.value }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: stat.label })
            ] }, stat.label)) })
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "default", animate: true, delay: 0.1, className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-4 h-4 text-primary" }),
          "Level Journey"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-6 left-0 right-0 h-0.5 bg-border z-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              className: "absolute top-6 left-0 h-0.5 gradient-teal z-0",
              initial: { width: 0 },
              animate: { width: `${trackFillPct}%` },
              transition: { duration: 1, delay: 0.4 }
            }
          ),
          LEVELS.map((lvl, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            LevelNode,
            {
              levelInfo: lvl,
              isActive: lvl.level === currentLevel.level,
              isCompleted: lvl.level < currentLevel.level,
              index: i
            },
            lvl.level
          ))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "default", animate: true, delay: 0.15, className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2", children: "🏅 Badge Collection" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-primary font-medium", children: [
            unlockedBadges.length,
            "/",
            displayBadges.length,
            " Unlocked"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-2.5", children: displayBadges.map((badge, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          BadgeCard,
          {
            badge,
            index: i,
            onSelect: setSelectedBadge
          },
          badge.id
        )) })
      ] }),
      recentBadges.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "default", animate: true, delay: 0.2, className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4", children: "🎉 Recent Achievements" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: recentBadges.map((badge, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            className: "flex items-center gap-3 p-3 rounded-lg glass-effect-dark border border-border/30",
            initial: { opacity: 0, x: -20 },
            whileInView: { opacity: 1, x: 0 },
            viewport: { once: true },
            transition: { duration: 0.35, delay: i * 0.08 },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full gradient-health flex items-center justify-center text-xl flex-shrink-0", children: badge.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground truncate", children: badge.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate", children: badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  }
                ) : "Recently unlocked" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-accent flex-shrink-0", children: [
                "+",
                badge.xpReward,
                " XP"
              ] })
            ]
          },
          badge.id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        GlassCard,
        {
          variant: "elevated",
          glow: checkupOverdue ? "green" : "none",
          animate: true,
          delay: 0.25,
          className: "p-5",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  checkupOverdue ? "gradient-health glow-green" : "gradient-teal"
                ),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-6 h-6 text-white" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold text-foreground", children: "Monthly Checkup" }),
                checkupOverdue ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium", children: "Overdue" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium", children: [
                  daysUntilCheckup,
                  "d left"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3", children: checkupOverdue ? "Your monthly checkup is overdue. Schedule now to earn bonus XP!" : `Next checkup due ${nextCheckup.toLocaleDateString("en-US", { month: "long", day: "numeric" })}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-accent font-semibold", children: "🎁 +50 Bonus XP on completion" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Link,
                  {
                    to: "/form",
                    className: "flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition-smooth",
                    "data-ocid": "checkup-schedule-btn",
                    children: [
                      "Start ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-3 h-3" })
                    ]
                  }
                )
              ] })
            ] })
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "subtle", animate: true, delay: 0.3, className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center", children: "🏆" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-foreground", children: "Community Rank" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Your regional standing" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg glass-effect-dark border border-border/30 mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-gradient-teal", children: "Top 15%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "in your region" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-foreground", children: [
              gamification.xp,
              " XP"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Total earned" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-4 h-4 text-muted-foreground flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-foreground", children: "Full Leaderboard" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Coming soon — compare with caregivers nationwide" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full", children: "Soon" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(GlassCard, { variant: "subtle", animate: true, delay: 0.35, className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "w-4 h-4 text-primary" }),
          "Earn More XP"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [
          { action: "Complete an assessment", xp: 50, icon: "📋" },
          { action: "Use camera analysis", xp: 20, icon: "📷" },
          { action: "Child scores Low Risk", xp: 30, icon: "💚" },
          { action: "Monthly checkup on time", xp: 50, icon: "📅" },
          { action: "Unlock a badge", xp: "varies", icon: "🏅" }
        ].map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            className: "flex items-center justify-between gap-3 py-2 border-b border-border/20 last:border-0",
            initial: { opacity: 0, x: 10 },
            whileInView: { opacity: 1, x: 0 },
            viewport: { once: true },
            transition: { duration: 0.3, delay: i * 0.05 },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: item.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-foreground", children: item.action })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-primary", children: [
                "+",
                item.xp,
                " XP"
              ] })
            ]
          },
          item.action
        )) })
      ] })
    ] })
  ] });
}
export {
  Gamification as default
};
