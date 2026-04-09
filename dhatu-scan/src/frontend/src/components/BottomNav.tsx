import { Link, useLocation } from "@tanstack/react-router";
import { Activity, Camera, Clock, Home, Star } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: <Home size={20} /> },
  { href: "/camera", label: "Scan", icon: <Camera size={20} /> },
  { href: "/results", label: "Results", icon: <Activity size={20} /> },
  { href: "/history", label: "History", icon: <Clock size={20} /> },
  { href: "/gamification", label: "Rewards", icon: <Star size={20} /> },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom"
      aria-label="Mobile navigation"
      data-ocid="bottom-nav"
    >
      {/* Glassmorphism bar */}
      <div className="glass-card border-t border-white/10 px-2 pt-2 pb-safe">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[44px] min-h-[44px] justify-center transition-smooth relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-ocid={`nav-${item.label.toLowerCase()}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {isActive ? (
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                    >
                      {item.icon}
                    </motion.span>
                  ) : (
                    item.icon
                  )}
                </span>
                <span className="text-[10px] font-medium relative z-10 leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
