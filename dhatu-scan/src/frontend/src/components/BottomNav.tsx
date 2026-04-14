import { useApp } from "@/context/AppContext";
import ThemeToggle from "./ThemeToggle";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ClipboardList,
  Home,
  LogOut,
  Shield,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: <Home size={20} /> },
  { href: "/screening", label: "Screening", icon: <ClipboardList size={20} /> },
  { href: "/results", label: "Results", icon: <Activity size={20} /> },
  { href: "/rewards", label: "Rewards", icon: <Star size={20} /> },
  { href: "/privacy", label: "Privacy", icon: <Shield size={20} /> },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useApp();

  const handleLogout = async () => {
    await signOut();
    await navigate({ to: "/" });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom"
      aria-label="Mobile navigation"
      data-ocid="bottom-nav"
    >
      <div
        className="px-2 pt-2 pb-safe"
        style={{ backgroundColor: "#F2EAE0", borderTop: "1px solid #d7cabb" }}
      >
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-smooth",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span className="relative z-10 text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-muted-foreground transition-smooth hover:text-foreground"
          >
            <span className="relative z-10">
              <LogOut size={20} />
            </span>
            <span className="relative z-10 text-[10px] font-medium leading-none">
              Logout
            </span>
          </button>
          <div className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-muted-foreground">
            <ThemeToggle compact />
            <span className="text-[10px] font-medium leading-none">Theme</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
