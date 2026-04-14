import { useApp } from "@/context/AppContext";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { db } from "@/lib/db";

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
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Invalid login credentials");
      }

      const data = await response.json();

      // Save to Dexie Local Store (ID 1)
      await db.currentUser.put({
        id: 1,
        email: email,
        auth_token: data.access_token,
        full_name: data.fullName || "Parent",
      });

      await signIn();
      await navigate({ to: "/dashboard" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to login");
    }
  };

  return (
    <div
      className="min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(181, 209, 218, 0.45) 0%, rgba(181, 209, 218, 0) 30%), radial-gradient(circle at top right, rgba(184, 164, 204, 0.32) 0%, rgba(184, 164, 204, 0) 34%), linear-gradient(180deg, #f4ebdf 0%, #efe3d4 48%, #f4ebdf 100%)",
      }}
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
        <div className="sticky top-0 z-40 mb-8 py-2">
          <div
            className="flex items-center justify-between rounded-full px-4 py-3 backdrop-blur-md sm:px-5"
            style={{
              backgroundColor: "rgba(255, 250, 245, 0.78)",
              border: "1px solid rgba(156, 143, 203, 0.22)",
              boxShadow: "0 14px 36px rgba(82, 69, 109, 0.08)",
            }}
          >
            <Link to="/" className="text-sm font-semibold" style={{ color: PALETTE.ink }}>
              Back
            </Link>
            <Link
              to="/register"
              className="rounded-full px-5 py-2 text-sm font-semibold transition-smooth"
              style={{
                backgroundColor: PALETTE.white,
                color: PALETTE.ink,
                border: `1px solid ${PALETTE.lavender}`,
              }}
            >
              Register
            </Link>
          </div>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span
              className="inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{
                backgroundColor: PALETTE.white,
                color: PALETTE.ink,
                border: `1px solid ${PALETTE.lavender}`,
              }}
            >
              Login
            </span>
            <h1
              className="mt-6 font-display text-5xl font-bold leading-[0.95] sm:text-6xl"
              style={{ color: PALETTE.ink }}
            >
              Continue your child care tracking with one secure sign in.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8" style={{ color: "#4d4561" }}>
              Open your dashboard, review previous screenings, and continue the next nutrition assessment from one place.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
          >
            <div
              className="rounded-[2rem] p-8 shadow-xl"
              style={{
                backgroundColor: "rgba(239, 227, 212, 0.88)",
                color: PALETTE.ink,
                border: "1px solid rgba(156, 143, 203, 0.24)",
                boxShadow: "0 24px 80px rgba(82, 69, 109, 0.12)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em]" style={{ color: PALETTE.muted }}>
                    Welcome Back
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold">
                    Sign in to Dhatu-Scan
                  </h2>
                </div>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold"
                  style={{ backgroundColor: PALETTE.blue, color: PALETTE.ink }}
                >
                  DS
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: PALETTE.muted }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: PALETTE.white,
                      color: PALETTE.ink,
                      border: `1px solid ${PALETTE.lavender}`,
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: PALETTE.muted }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: PALETTE.white,
                      color: PALETTE.ink,
                      border: `1px solid ${PALETTE.lavender}`,
                    }}
                  />
                </div>
                
                {errorMsg && (
                  <div className="text-red-500 text-sm mt-2 font-medium">{errorMsg}</div>
                )}

                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full rounded-2xl px-5 py-3 font-semibold transition-smooth"
                  style={{
                    backgroundColor: PALETTE.buttonDark,
                    color: PALETTE.white,
                  }}
                >
                  Login
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
