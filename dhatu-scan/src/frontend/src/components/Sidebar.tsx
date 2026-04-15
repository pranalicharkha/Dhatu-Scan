import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ClipboardList,
  Home,
  LogOut,
  PanelLeftClose,
  Plus,
  Shield,
  ShieldCheck,
  Star,
  Stethoscope,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { getCurrentUser } from "../data/userRepository";
import { cn } from "../lib/utils";
import { getLevelProgress } from "../utils/assessmentLogic";
import { calculateAgeInMonths, formatAgeFromMonths } from "../utils/childAge";

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

function getDisplayName(
  fullName: string | undefined,
  email: string | undefined,
): string {
  const normalizedFullName = fullName?.trim();
  if (normalizedFullName) return normalizedFullName;

  const emailPrefix = email?.trim().split("@")[0]?.trim();
  return emailPrefix && emailPrefix.length > 0 ? emailPrefix : "Parent";
}

export default function Sidebar({
  onToggle,
}: {
  onToggle?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { state, activeChild, signOut, setActiveChild } = useApp();
  const [parentName, setParentName] = useState("Parent");
  const levelProgress = getLevelProgress(state.gamification.xp);
  const isDark = resolvedTheme === "dark";
  const shellBg = isDark ? "#161C24" : "#F2EAE0";
  const shellBorder = isDark ? "#2A3342" : "#d7cabb";
  const cardBg = isDark ? "#1D2430" : "#E8DDD0";
  const cardBorder = isDark ? "#2A3342" : "#d7cabb";
  const inputBg = isDark ? "#111722" : "#FFFAF5";
  const hoverBg = isDark ? "#212938" : "#E8DDD0";
  const primaryButtonBg = isDark ? "#7C6BC0" : "#52456D";

  const handleLogout = async () => {
    await signOut();
    await navigate({ to: "/" });
  };

  useEffect(() => {
    let isMounted = true;
    void getCurrentUser().then((user) => {
      if (!isMounted) return;
      setParentName(getDisplayName(user?.full_name, user?.email));
    });
    return () => {
      isMounted = false;
    };
  }, [state.isAuthenticated]);

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col overflow-hidden md:flex"
      style={{ backgroundColor: shellBg, borderRight: `1px solid ${shellBorder}` }}
      aria-label="Desktop navigation"
      data-ocid="sidebar"
    >
      <div
        className="shrink-0 px-6 py-5"
        style={{ backgroundColor: shellBg, borderBottom: `1px solid ${shellBorder}` }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-teal text-sm font-bold text-primary-foreground shadow-glow-teal">
              DS
            </div>
            <div>
              <div className="font-display text-lg font-bold leading-tight text-foreground">
                Dhatu-Scan
              </div>
              <div className="text-[11px] leading-tight text-muted-foreground">
                Child care command center
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={onToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-smooth"
            style={{ backgroundColor: "transparent" }}
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={18} className="text-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-1 px-3 py-4" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-smooth hover:-translate-y-0.5",
                isActive
                  ? "text-primary-foreground"
                  : "text-[#6d6578] hover:text-[#403552]",
              )}
                style={isActive ? undefined : { backgroundColor: "transparent" }}
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

        {activeChild ? (
          <div className="px-3 py-3" style={{ borderTop: `1px solid ${shellBorder}` }}>
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
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
                    {formatAgeFromMonths(
                      activeChild.dateOfBirth
                        ? calculateAgeInMonths(activeChild.dateOfBirth)
                        : activeChild.age,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label
                  htmlFor="sidebar-child-switcher"
                  className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Child Profile
                </label>
                <select
                  id="sidebar-child-switcher"
                  value={activeChild.id}
                  onChange={(e) => setActiveChild(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-smooth hover:bg-[#FFFDFC]"
                  style={{
                    backgroundColor: inputBg,
                    color: "var(--foreground)",
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  {state.children.map((child) => {
                    const ageLabel = formatAgeFromMonths(
                      child.dateOfBirth
                        ? calculateAgeInMonths(child.dateOfBirth)
                        : child.age,
                    );
                    return (
                      <option key={child.id} value={child.id}>
                        {child.name} • {ageLabel}
                      </option>
                    );
                  })}
                </select>
                <Link
                  to="/children"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-smooth hover:-translate-y-0.5"
                  style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}` }}
                >
                  <Plus size={14} />
                  Add Or Manage Child Profiles
                </Link>
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
                  style={{ backgroundColor: shellBorder }}
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
        ) : (
          <div className="px-3 py-3" style={{ borderTop: `1px solid ${shellBorder}` }}>
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <p className="text-sm font-semibold text-foreground">
                No child profile selected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add your first child profile to start screening and track each
                child separately.
              </p>
              <Link
                to="/children"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-smooth hover:-translate-y-0.5"
                style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}` }}
              >
                <Plus size={14} />
                Add Child Profile
              </Link>
            </div>
          </div>
        )}

        <div className="space-y-3 px-4 py-4" style={{ borderTop: `1px solid ${shellBorder}` }}>
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="mb-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Parent Account
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Signed in caregiver access
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-white transition-smooth hover:-translate-y-0.5 hover:opacity-95"
              style={{ backgroundColor: primaryButtonBg }}
            >
              <LogOut size={15} />
              Logout {parentName}
            </button>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-muted-foreground"
            style={{ backgroundColor: cardBg }}
          >
            <ShieldCheck size={14} />
            Privacy-first and offline ready
          </div>
        </div>
      </div>
    </aside>
  );
}
