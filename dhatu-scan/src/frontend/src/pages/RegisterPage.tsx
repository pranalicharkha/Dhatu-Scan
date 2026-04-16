import { useApp } from "@/context/AppContext";
import { API_BASE } from "@/lib/api";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "next-themes";


const PALETTE = {
  page: "#f4ebdf",
  panel: "#efe3d4",
  blue: "#b5d1da",
  lavender: "#b8a4cc",
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useApp();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setMsg("");
    setIsLoading(true);
    try {
      // First check if backend is reachable
      let backendOk = false;
      try {
        const health = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
        backendOk = health.ok;
      } catch {
        throw new Error("Cannot reach the backend server. Please start the Python backend from the project root using npm run dev:backend:windows.");
      }

      if (!backendOk) throw new Error("Backend server returned an error. Please restart it.");

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.detail === "Email already registered"
          ? "This email is already registered. Please login instead."
          : errorData.detail || "Registration failed");
      }

      if (!response.ok) {
        throw new Error("Registration failed. Please try again.");
      }

      setMsg("Registration successful! Redirecting to login...");
      setTimeout(() => navigate({ to: "/login" }), 1500);
    } catch (err: any) {
      setMsg(err.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  const pageBackground = isDark
    ? "radial-gradient(circle at top left, rgba(72, 91, 123, 0.22) 0%, rgba(72, 91, 123, 0) 30%), radial-gradient(circle at top right, rgba(156, 143, 203, 0.2) 0%, rgba(156, 143, 203, 0) 34%), linear-gradient(180deg, #151821 0%, #1b202b 48%, #151821 100%)"
    : "radial-gradient(circle at top left, rgba(181, 209, 218, 0.45) 0%, rgba(181, 209, 218, 0) 30%), radial-gradient(circle at top right, rgba(184, 164, 204, 0.32) 0%, rgba(184, 164, 204, 0) 34%), linear-gradient(180deg, #f4ebdf 0%, #efe3d4 48%, #f4ebdf 100%)";
  const primaryText = isDark ? PALETTE.darkInk : PALETTE.ink;
  const mutedText = isDark ? PALETTE.darkMuted : PALETTE.muted;
  const badgeBackground = isDark ? "rgba(255, 250, 245, 0.08)" : PALETTE.white;
  const badgeBorder = isDark ? PALETTE.darkBorder : PALETTE.lavender;
  const cardBackground = isDark ? "rgba(31, 36, 48, 0.72)" : "rgba(239, 227, 212, 0.88)";
  const cardBorder = isDark ? PALETTE.darkBorder : "rgba(156, 143, 203, 0.24)";
  const cardShadow = isDark
    ? "0 24px 80px rgba(0, 0, 0, 0.32)"
    : "0 24px 80px rgba(82, 69, 109, 0.12)";

  return (
    <div
      className="min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-10"
      style={{ background: pageBackground }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70">
        <div
          className="absolute left-[8%] top-12 h-36 w-36 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(181, 209, 218, 0.55)" }}
        />
        <div
          className="absolute right-[10%] top-20 h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(184, 164, 204, 0.4)" }}
        />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold transition-smooth hover:opacity-80" style={{ color: primaryText }}>
            ← Home
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle compact />
            <Link
              to="/login"
              className="rounded-full px-5 py-2 text-sm font-semibold transition-smooth"
              style={{
                backgroundColor: badgeBackground,
                color: primaryText,
                border: `1px solid ${badgeBorder}`,
              }}
            >
              Login
            </Link>
          </div>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.9fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span
              className="inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{
                backgroundColor: badgeBackground,
                color: primaryText,
                border: `1px solid ${badgeBorder}`,
              }}
            >
              Register
            </span>
            <h1
              className="mt-6 font-display text-5xl font-bold leading-[0.95] sm:text-6xl"
              style={{ color: primaryText }}
            >
              Create your caregiver account and start screening from a dedicated page.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8" style={{ color: mutedText }}>
              Register once to access the dashboard, track children, and continue nutrition follow-ups without the first-page popup box.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            className="lg:sticky lg:top-8"
          >
            <div
              className="rounded-[2rem] p-8 shadow-xl"
              style={{
                backgroundColor: cardBackground,
                color: primaryText,
                border: `1px solid ${cardBorder}`,
                boxShadow: cardShadow,
              }}
            >
              <div>
                <p className="text-sm uppercase tracking-[0.22em]" style={{ color: mutedText }}>
                  New Account
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  Register for Dhatu-Scan
                </h2>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: mutedText }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Caregiver Name"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: badgeBackground,
                      color: primaryText,
                      border: `1px solid ${badgeBorder}`,
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: mutedText }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="caregiver@dhatuscan.app"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: badgeBackground,
                      color: primaryText,
                      border: `1px solid ${badgeBorder}`,
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: mutedText }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: badgeBackground,
                      color: primaryText,
                      border: `1px solid ${badgeBorder}`,
                    }}
                  />
                </div>

                {msg && (
                  <div className={`text-sm mt-2 font-medium ${msg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                    {msg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="w-full rounded-2xl px-5 py-3 font-semibold transition-smooth disabled:opacity-60"
                  style={{
                    backgroundColor: PALETTE.buttonDark,
                    color: PALETTE.white,
                  }}
                >
                  {isLoading ? "Connecting..." : "Create Account"}
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
