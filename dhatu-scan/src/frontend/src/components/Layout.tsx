import { Outlet, useLocation } from "@tanstack/react-router";
import { PanelLeftOpen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import BottomNav from "./BottomNav";
import FloatingParticles from "./FloatingParticles";
import LoadingSpinner from "./LoadingSpinner";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import DhatuAssistant from "./DhatuAssistant";

export default function Layout() {
  const location = useLocation();
  const { state } = useApp();
  const { resolvedTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  if (state.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-teal shadow-glow-teal">
            <span className="text-2xl font-bold text-primary-foreground">DS</span>
          </div>
          <h1 className="mb-2 font-display text-xl font-bold text-foreground">
            Dhatu-Scan
          </h1>
          <LoadingSpinner label="Initializing..." />
        </div>
      </div>
    );
  }

  const isPublicPage = location.pathname === "/";
  const showShell = state.isAuthenticated && !isPublicPage;
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={
        showShell
          ? `${isDark ? "" : "app-shell-light"} relative min-h-screen text-foreground`
          : "relative min-h-screen text-foreground"
      }
      style={
        showShell
          ? { backgroundColor: isDark ? "#141821" : "#F2EAE0" }
          : undefined
      }
    >
      {!showShell && <FloatingParticles />}

      {showShell && isSidebarOpen && (
        <Sidebar onToggle={() => setIsSidebarOpen(false)} />
      )}

      {showShell && !isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 hidden items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition-smooth md:inline-flex"
          style={{
            backgroundColor: isDark ? "#1D2430" : "#FFFAF5",
            borderColor: isDark ? "#2C3545" : "#d7cabb",
          }}
          aria-label="Open sidebar"
        >
          <PanelLeftOpen size={16} />
          Menu
        </button>
      )}

      <div
        className={`fixed right-4 top-4 z-50 ${showShell ? "md:right-6" : ""}`}
      >
        <ThemeToggle />
      </div>

      {showShell && <DhatuAssistant />}

      <div
        className={
          showShell
            ? `relative z-10 transition-[margin] duration-300 ${isSidebarOpen ? "md:ml-72" : "md:ml-0"}`
            : "relative z-10"
        }
      >
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={showShell ? "pb-24 md:pb-8" : ""}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

      </div>

      {showShell && <BottomNav />}
    </div>
  );
}
