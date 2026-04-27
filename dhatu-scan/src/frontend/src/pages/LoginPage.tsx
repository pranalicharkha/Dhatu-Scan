import { useApp } from "@/context/AppContext";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { useTheme } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";

import { API_BASE } from "@/lib/api";

import { saveCurrentUser } from "@/data/userRepository";

const PALETTE = {
  page: "#f4ebdf",
  panel: "#efe3d4",
  blue: "#b5d1da",
  lavender: "#b8a4cc",
  purple: "#9c8fcb",
  ink: "#403552",
  muted: "#6a5f79",
  white: "#fffaf5",
  buttonDark: "#52456d",
  darkPage: "#151821",
  darkPanel: "#202634",
  darkBlue: "#253747",
  darkLavender: "#332b45",
  darkPurple: "#46385f",
  darkInk: "#f4f1fb",
  darkMuted: "#b8b1c9",
  darkBorder: "rgba(179, 155, 255, 0.24)",
};

function getDisplayName(fullName: string | undefined, email: string): string {
  const normalizedFullName = fullName?.trim();
  if (normalizedFullName) return normalizedFullName;

  const emailPrefix = email.trim().split("@")[0]?.trim();
  return emailPrefix && emailPrefix.length > 0 ? emailPrefix : "Parent";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useApp();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || "Invalid login credentials");
      }

      const data = await response.json();

      // Save to IndexedDB via consolidated repository
      await saveCurrentUser({
        id: 1,
        email: email,
        auth_token: data.access_token,
        full_name: getDisplayName(data.fullName, email),
      });
      localStorage.setItem("dhatu_auth_email", email.trim());

      await signIn();
      await navigate({ to: "/dashboard" });
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setErrorMsg("Cannot reach the server. Please make sure the backend is running.");
      } else {
        setErrorMsg(err.message || "Failed to login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pageBackground = isDark
    ? "radial-gradient(ellipse at 20% 0%, rgba(72, 91, 145, 0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(124, 107, 168, 0.2) 0%, transparent 50%), linear-gradient(180deg, #0f1219 0%, #161b26 50%, #0f1219 100%)"
    : "radial-gradient(ellipse at 20% 0%, rgba(181, 209, 218, 0.5) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(184, 164, 204, 0.35) 0%, transparent 50%), linear-gradient(180deg, #f4ebdf 0%, #ede1d3 50%, #f4ebdf 100%)";
  const primaryText = isDark ? PALETTE.darkInk : PALETTE.ink;
  const mutedText = isDark ? PALETTE.darkMuted : PALETTE.muted;
  const badgeBackground = isDark ? "rgba(255, 250, 245, 0.06)" : PALETTE.white;
  const badgeBorder = isDark ? PALETTE.darkBorder : PALETTE.lavender;
  const cardBackground = isDark ? "rgba(22, 27, 38, 0.85)" : "rgba(255, 250, 245, 0.82)";
  const cardBorder = isDark ? "rgba(124, 107, 168, 0.2)" : "rgba(156, 143, 203, 0.24)";
  const cardShadow = isDark
    ? "0 32px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(124, 107, 168, 0.08)"
    : "0 32px 80px rgba(82, 69, 109, 0.14), 0 0 0 1px rgba(156, 143, 203, 0.08)";
  const inputBackground = isDark ? "rgba(255, 250, 245, 0.04)" : "rgba(255, 255, 255, 0.7)";
  const inputBorder = isDark ? "rgba(179, 155, 255, 0.16)" : "rgba(156, 143, 203, 0.3)";
  const inputFocusBorder = isDark ? "rgba(156, 143, 203, 0.5)" : PALETTE.purple;

  return (
    <div
      className="min-h-screen overflow-hidden relative flex flex-col"
      style={{ background: pageBackground }}
    >
      {/* Subtle ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-[5%] top-[-5%] h-[500px] w-[500px] rounded-full blur-[120px] opacity-30"
          style={{ backgroundColor: isDark ? "rgba(72, 91, 145, 0.3)" : "rgba(181, 209, 218, 0.5)" }}
        />
        <div
          className="absolute right-[0%] top-[10%] h-[400px] w-[400px] rounded-full blur-[100px] opacity-25"
          style={{ backgroundColor: isDark ? "rgba(124, 107, 168, 0.25)" : "rgba(184, 164, 204, 0.4)" }}
        />
        <div
          className="absolute left-[40%] bottom-[-10%] h-[600px] w-[600px] rounded-full blur-[140px] opacity-20"
          style={{ backgroundColor: isDark ? "rgba(88, 75, 128, 0.2)" : "rgba(156, 143, 203, 0.25)" }}
        />
      </div>

      {/* Integrated Header — merged into the page naturally */}
      <header className="relative z-20 px-5 py-4 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition-transform group-hover:scale-105"
              style={{ backgroundColor: PALETTE.purple, color: PALETTE.white }}
            >
              DS
            </div>
            <div>
              <div className="font-display text-lg font-bold" style={{ color: primaryText }}>
                Dhatu-Scan
              </div>
              <p className="text-[11px] leading-none" style={{ color: mutedText }}>
                Early malnutrition detection
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link
              to="/register"
              className="rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: PALETTE.buttonDark,
                color: PALETTE.white,
              }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content — centered vertically */}
      <div className="relative z-10 flex-1 flex items-center px-5 sm:px-8 lg:px-12 pb-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Left: Hero Content */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-lg"
            >
              <motion.span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{
                  backgroundColor: badgeBackground,
                  color: mutedText,
                  border: `1px solid ${badgeBorder}`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Welcome Back
              </motion.span>

              <motion.h1
                className="mt-5 font-display text-4xl font-bold leading-[1.1] sm:text-5xl"
                style={{ color: primaryText }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                Continue your{" "}
                <span
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, #b8a4cc, #9c8fcb)"
                      : "linear-gradient(135deg, #7c6ba8, #5f5282)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  child care
                </span>{" "}
                tracking journey
              </motion.h1>

              <motion.p
                className="mt-5 max-w-md text-base leading-7"
                style={{ color: mutedText }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Open your dashboard, review previous screenings, and continue
                the next nutrition assessment from one secure place.
              </motion.p>

              {/* Trust Indicators */}
              <motion.div
                className="mt-8 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {[
                  { icon: "🤖", label: "AI Powered" },
                  { icon: "🔒", label: "Privacy-First" },
                  { icon: "📊", label: "WHO Standards" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: badgeBackground,
                      color: mutedText,
                      border: `1px solid ${badgeBorder}`,
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.section>

            {/* Right: Login Card */}
            <motion.section
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full max-w-md mx-auto lg:ml-auto"
            >
              <div
                className="rounded-3xl p-7 sm:p-8 backdrop-blur-xl"
                style={{
                  backgroundColor: cardBackground,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: cardShadow,
                }}
              >
                {/* Card Header */}
                <div className="flex items-center gap-4 mb-7">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold shrink-0"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, #332b45, #46385f)"
                        : "linear-gradient(135deg, #b5d1da, #b8a4cc)",
                      color: isDark ? PALETTE.darkInk : PALETTE.ink,
                    }}
                  >
                    DS
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold" style={{ color: primaryText }}>
                      Sign in
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: mutedText }}>
                      Access your Dhatu-Scan dashboard
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: mutedText }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:opacity-40"
                      style={{
                        backgroundColor: inputBackground,
                        color: primaryText,
                        border: `1.5px solid ${inputBorder}`,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = inputFocusBorder;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${isDark ? "rgba(156, 143, 203, 0.1)" : "rgba(156, 143, 203, 0.15)"}`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = inputBorder;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: mutedText }}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all duration-200 placeholder:opacity-40"
                        style={{
                          backgroundColor: inputBackground,
                          color: primaryText,
                          border: `1.5px solid ${inputBorder}`,
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = inputFocusBorder;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${isDark ? "rgba(156, 143, 203, 0.1)" : "rgba(156, 143, 203, 0.15)"}`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = inputBorder;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-50 hover:opacity-80 transition-opacity"
                        style={{ color: mutedText }}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMsg && (
                    <motion.div
                      className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                      style={{
                        backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.08)",
                        color: isDark ? "#fca5a5" : "#dc2626",
                        border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.15)"}`,
                      }}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="shrink-0 mt-0.5">⚠️</span>
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {/* Login Button */}
                  <motion.button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full rounded-xl px-5 py-3.5 font-semibold text-sm transition-all duration-200 relative overflow-hidden"
                    style={{
                      background: isLoading
                        ? isDark ? "#3a3050" : "#8a7baa"
                        : "linear-gradient(135deg, #7c6ba8, #52456d)",
                      color: PALETTE.white,
                      boxShadow: isLoading ? "none" : "0 4px 20px rgba(124, 107, 168, 0.35)",
                    }}
                    whileHover={isLoading ? {} : { scale: 1.02, y: -1 }}
                    whileTap={isLoading ? {} : { scale: 0.98 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </motion.button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: mutedText }}>
                      New here?
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
                  </div>

                  {/* Register Link */}
                  <Link
                    to="/register"
                    className="block w-full rounded-xl px-5 py-3 text-sm font-semibold text-center transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      backgroundColor: badgeBackground,
                      color: primaryText,
                      border: `1.5px solid ${badgeBorder}`,
                    }}
                  >
                    Create a Free Account
                  </Link>
                </div>

                {/* Server Status Indicator */}
                <div className="mt-5 flex items-center justify-center gap-2">
                  <ServerStatus />
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small component that pings the backend health endpoint */
function ServerStatus() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");

  useState(() => {
    fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) })
      .then((r) => {
        if (r.ok) setStatus("online");
        else setStatus("offline");
      })
      .catch(() => setStatus("offline"));
  });

  const colors = {
    checking: { dot: "#f59e0b", text: isDark ? "#d4a" : "#92400e" },
    online: { dot: "#10b981", text: isDark ? "#6ee7b7" : "#047857" },
    offline: { dot: "#ef4444", text: isDark ? "#fca5a5" : "#b91c1c" },
  };

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: colors[status].text }}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "checking" ? "animate-pulse" : ""}`}
        style={{ backgroundColor: colors[status].dot }}
      />
      {status === "checking" && "Checking server..."}
      {status === "online" && "Server connected"}
      {status === "offline" && "Server offline — start backend"}
    </div>
  );
}
