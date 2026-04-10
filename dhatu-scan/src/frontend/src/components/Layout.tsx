import { Outlet, useLocation } from "@tanstack/react-router";
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

  return (
    <div
      className={showShell ? "app-shell-light relative min-h-screen text-foreground" : "relative min-h-screen text-foreground"}
      style={showShell ? { backgroundColor: "#F2EAE0" } : undefined}
    >
      {!showShell && <FloatingParticles />}

      {showShell && <Sidebar />}

      <div className={showShell ? "relative z-10 md:ml-72" : "relative z-10"}>
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

        {!isPublicPage && (
          <footer
            className="hidden px-8 py-4 md:block"
            style={showShell ? { borderTop: "1px solid #d7cabb", backgroundColor: "#F2EAE0" } : undefined}
          >
            <p className="text-center text-xs text-muted-foreground">
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

      {showShell && <BottomNav />}
    </div>
  );
}
