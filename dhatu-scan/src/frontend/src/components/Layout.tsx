import { Outlet } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "../context/AppContext";
import BottomNav from "./BottomNav";
import FloatingParticles from "./FloatingParticles";
import LoadingSpinner from "./LoadingSpinner";
import Sidebar from "./Sidebar";

export default function Layout() {
  const location = useLocation();
  const { state } = useApp();

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-teal flex items-center justify-center mx-auto mb-4 shadow-glow-teal">
            <span className="text-3xl">🔬</span>
          </div>
          <h1 className="font-display font-bold text-xl text-foreground mb-2">
            Dhatu-Scan
          </h1>
          <LoadingSpinner label="Initializing..." />
        </div>
      </div>
    );
  }

  const isLandingPage = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Animated background */}
      <FloatingParticles />

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="md:ml-64 relative z-10">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={isLandingPage ? "" : "pb-24 md:pb-8"}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        {/* Footer — desktop only, hidden on landing */}
        {!isLandingPage && (
          <footer className="hidden md:block px-8 py-4 border-t border-white/10 bg-card/50">
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        )}
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
