import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ClipboardList,
  Home,
  LogOut,
  Shield,
  ShieldCheck,
  Star,
  Stethoscope,
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
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { href: "/screening", label: "Screening", icon: <ClipboardList size={18} /> },
  {
    href: "/results",
    label: "Results & Statistics",
    icon: <Activity size={18} />,
  },
  { href: "/rewards", label: "Rewards", icon: <Star size={18} /> },
  { href: "/consult", label: "Consult", icon: <Stethoscope size={18} /> },
  { href: "/privacy", label: "Privacy", icon: <Shield size={18} /> },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, activeChild, signOut } = useApp();
  const levelProgress = getLevelProgress(state.gamification.xp);

  const handleLogout = async () => {
    signOut();
    await navigate({ to: "/" });
  };

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 z-40 min-h-screen w-72 flex-col"
      style={{ backgroundColor: "#F2EAE0", borderRight: "1px solid #d7cabb" }}
      aria-label="Desktop navigation"
      data-ocid="sidebar"
    >
      <div
        className="px-6 py-5"
        style={{ borderBottom: "1px solid #d7cabb" }}
      >
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-teal text-sm font-bold text-primary-foreground shadow-glow-teal">
            DS
          </div>
          <div>
            <div className="font-display text-lg font-bold text-foreground leading-tight">
              Dhatu-Scan
            </div>
            <div className="text-[11px] text-muted-foreground leading-tight">
              Child care command center
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-smooth",
                isActive
                  ? "text-primary-foreground"
                  : "text-[#6d6578] hover:text-[#403552]",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: "#9C8FCB" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.icon}</span>
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {activeChild && (
        <div
          className="px-3 py-3"
          style={{ borderTop: "1px solid #d7cabb" }}
        >
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: "#E8DDD0", border: "1px solid #d7cabb" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-health text-xs font-bold text-primary-foreground">
                {activeChild.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {activeChild.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.floor(activeChild.age / 12)}y {activeChild.age % 12}m
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  {state.gamification.levelName}
                </span>
                <span className="font-semibold text-primary">
                  {state.gamification.xp} XP
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: "#d7cabb" }}
              >
                <motion.div
                  className="h-full rounded-full gradient-teal"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="space-y-3 px-4 py-4"
        style={{ borderTop: "1px solid #d7cabb" }}
      >
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-muted-foreground"
          style={{ backgroundColor: "#E8DDD0" }}
        >
          <ShieldCheck size={14} />
          Privacy-first and offline ready
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition-smooth"
          style={{ backgroundColor: "#E8DDD0", border: "1px solid #d7cabb" }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}
