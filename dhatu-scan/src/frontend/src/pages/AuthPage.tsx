import { useApp } from "@/context/AppContext";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";

const STEPS = [
  {
    title: "1. Screening",
    desc: "Capture body measurements and first visual screening for early malnutrition risk.",
    bg: "#f4ebdf",
    text: "#4f4567",
  },
  {
    title: "2. Data Adding",
    desc: "Add child age, diet, weight, height, and health details for a stronger assessment.",
    bg: "#b5d1da",
    text: "#314552",
  },
  {
    title: "3. ML Detect",
    desc: "The model analyzes the screening inputs to detect possible undernutrition patterns.",
    bg: "#b8a4cc",
    text: "#45385f",
  },
  {
    title: "4. Results",
    desc: "View the risk result, trends, and the next care action in one clear dashboard.",
    bg: "#9c8fcb",
    text: "#f8f3ed",
  },
];

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

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useApp();

  const enterApp = async () => {
    signIn();
    await navigate({ to: "/dashboard" });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #f4ebdf 0%, #f4ebdf 34%, #b5d1da 34%, #b5d1da 58%, #b8a4cc 58%, #b8a4cc 79%, #9c8fcb 79%, #9c8fcb 100%)",
      }}
    >
      <header className="px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold"
              style={{ backgroundColor: PALETTE.purple, color: PALETTE.white }}
            >
              DS
            </div>
            <div>
              <div
                className="font-display text-xl font-bold"
                style={{ color: PALETTE.ink }}
              >
                Dhatu-Scan
              </div>
              <p className="text-xs" style={{ color: PALETTE.muted }}>
                Early malnutrition detection support
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={enterApp}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-smooth"
              style={{
                backgroundColor: PALETTE.white,
                color: PALETTE.ink,
                border: `1px solid ${PALETTE.lavender}`,
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={enterApp}
              className="rounded-full px-5 py-2 text-sm font-semibold transition-smooth"
              style={{
                backgroundColor: PALETTE.buttonDark,
                color: PALETTE.white,
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-12 pt-4 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="pt-4 lg:pt-10">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{
                backgroundColor: PALETTE.white,
                color: PALETTE.ink,
                border: `1px solid ${PALETTE.lavender}`,
              }}
            >
              Child Nutrition Screening Platform
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-6 max-w-4xl font-display text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl"
              style={{ color: PALETTE.ink }}
            >
              Detect malnutrition early,
              <span className="block" style={{ color: "#5f5282" }}>
                guide families faster,
              </span>
              <span className="block" style={{ color: "#ffffff" }}>
                and act with confidence.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="mt-6 max-w-2xl text-lg leading-8"
              style={{ color: "#4d4561" }}
            >
              Dhatu-Scan supports caregivers and health workers with a clear
              workflow for screening, data entry, ML-based risk detection, and
              easy-to-read results for child nutrition care.
            </motion.p>

            <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
              {STEPS.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.06 }}
                  className="rounded-[1.75rem] p-5 shadow-sm"
                  style={{ backgroundColor: step.bg, color: step.text }}
                >
                  <p className="font-display text-xl font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm leading-6">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <motion.section
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.16 }}
            className="lg:pt-6"
          >
            <div
              className="rounded-[2rem] p-8 shadow-xl"
              style={{ backgroundColor: PALETTE.panel, color: PALETTE.ink }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm uppercase tracking-[0.22em]"
                    style={{ color: PALETTE.muted }}
                  >
                    Welcome Back
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold">
                    Sign in to continue care tracking
                  </h2>
                </div>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold"
                  style={{ backgroundColor: PALETTE.blue, color: PALETTE.ink }}
                >
                  +
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: PALETTE.muted }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="caregiver@dhatuscan.app"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: PALETTE.white,
                      color: PALETTE.ink,
                      border: `1px solid ${PALETTE.lavender}`,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: PALETTE.muted }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    defaultValue="password"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: PALETTE.white,
                      color: PALETTE.ink,
                      border: `1px solid ${PALETTE.lavender}`,
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={enterApp}
                  className="w-full rounded-2xl px-5 py-3 font-semibold transition-smooth"
                  style={{
                    backgroundColor: PALETTE.buttonDark,
                    color: PALETTE.white,
                  }}
                >
                  Login / Sign In
                </button>
              </div>

              <div
                className="mt-6 rounded-2xl p-4 text-sm leading-6"
                style={{ backgroundColor: PALETTE.blue, color: "#3d4b56" }}
              >
                Use this login to enter the dashboard, start screening, review
                nutrition risk results, and guide the next care decision.
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
