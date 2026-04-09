import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  Camera,
  ChevronRight,
  Clock,
  Home,
  Shield,
  Star,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { cn } from "../lib/utils";
import { getLevelProgress } from "../utils/assessmentLogic";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: <Home size={18} /> },
  { href: "/camera", label: "Camera Scan", icon: <Camera size={18} /> },
  { href: "/form", label: "Child Details", icon: <User size={18} /> },
  { href: "/results", label: "Results", icon: <Activity size={18} /> },
  { href: "/history", label: "Growth History", icon: <Clock size={18} /> },
  { href: "/gamification", label: "Rewards", icon: <Star size={18} /> },
  { href: "/privacy", label: "Privacy", icon: <Shield size={18} /> },
];

export default function Sidebar() {
  const location = useLocation();
  const { state, activeChild } = useApp();
  const { gamification } = state;
  const levelProgress = getLevelProgress(gamification.xp);

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen border-r border-white/10 glass-card fixed left-0 top-0 z-40"
      aria-label="Desktop navigation"
      data-ocid="sidebar"
    >
      {/* Brand header */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl gradient-teal flex items-center justify-center shadow-glow-teal">
            <span className="text-lg">🔬</span>
          </div>
          <div>
            <div className="font-display font-bold text-foreground text-base leading-tight">
              Dhatu-Scan
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              AI Malnutrition Detection
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation links */}
      <nav
        className="flex-1 px-3 py-4 space-y-0.5"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth relative group",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              )}
              data-ocid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 rounded-lg gradient-teal opacity-90"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span
                className={cn("relative z-10", isActive ? "opacity-90" : "")}
              >
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
              {item.badge && (
                <span className="relative z-10 ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Child profile switcher */}
      {activeChild && (
        <div className="px-3 pb-3 border-t border-white/10 pt-3">
          <div className="glass-effect-dark rounded-xl p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full gradient-health flex items-center justify-center text-sm flex-shrink-0">
                {activeChild.gender === "female" ? "👧" : "👦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {activeChild.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.floor(activeChild.age / 12)}y {activeChild.age % 12}m
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
            {/* Level progress */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">
                  {gamification.levelName}
                </span>
                <span className="text-[10px] text-primary font-semibold">
                  {gamification.xp} XP
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-teal"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/10">
        <p className="text-[10px] text-muted-foreground text-center">
          Privacy-first • Offline ready
        </p>
      </div>
    </aside>
  );
}
