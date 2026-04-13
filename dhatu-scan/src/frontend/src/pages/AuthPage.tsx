import { useApp } from "@/context/AppContext";
import { Link, Navigate } from "@tanstack/react-router";
import { motion } from "motion/react";

const STEPS = [
  {
    number: "01",
    title: "Screening",
    desc: "Capture body measurements and complete the first visual screening for early malnutrition risk.",
    bg: "#f4ebdf",
    text: "#4f4567",
  },
  {
    number: "02",
    title: "Data Adding",
    desc: "Add child age, diet, weight, height, and health details for a stronger assessment.",
    bg: "#b5d1da",
    text: "#314552",
  },
  {
    number: "03",
    title: "ML Detect",
    desc: "The model analyzes the screening inputs to detect possible undernutrition patterns.",
    bg: "#b8a4cc",
    text: "#45385f",
  },
  {
    number: "04",
    title: "Results",
    desc: "View the risk result, trends, and the next care action in one clear dashboard.",
    bg: "#9c8fcb",
    text: "#f8f3ed",
  },
];

const INFO_CARDS = [
  {
    title: "What Is Malnutrition?",
    desc: "Malnutrition happens when a child does not get the right balance of nutrition needed for growth, immunity, brain development, and daily energy.",
    tone: "#f4ebdf",
    text: "#4f4567",
  },
  {
    title: "Effects On Children",
    desc: "It can lead to stunting, weak immunity, poor learning ability, delayed development, and higher risk during illness if it is not detected early.",
    tone: "#b5d1da",
    text: "#314552",
  },
  {
    title: "Benefits Of Early Detection",
    desc: "Early screening helps families act sooner with food, care, and clinical support before malnutrition becomes severe or causes long-term damage.",
    tone: "#b8a4cc",
    text: "#45385f",
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

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p
        className="text-xs font-semibold uppercase tracking-[0.22em]"
        style={{ color: PALETTE.muted }}
      >
        {eyebrow}
      </p>
      <h2
        className="mt-4 font-display text-3xl font-bold sm:text-4xl"
        style={{ color: PALETTE.ink }}
      >
        {title}
      </h2>
      <p className="mt-4 text-base leading-7" style={{ color: "#4d4561" }}>
        {description}
      </p>
    </div>
  );
}

export default function AuthPage() {
  const { state } = useApp();

  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div
      className="min-h-screen overflow-hidden"
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

      <header className="sticky top-0 z-40 px-4 py-4 sm:px-6 lg:px-10">
        <div
          className="mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-3 backdrop-blur-md sm:px-5"
          style={{
            backgroundColor: "rgba(255, 250, 245, 0.78)",
            border: "1px solid rgba(156, 143, 203, 0.22)",
            boxShadow: "0 14px 36px rgba(82, 69, 109, 0.08)",
          }}
        >
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
            <Link
              to="/login"
              className="rounded-full px-5 py-2 text-sm font-semibold transition-smooth"
              style={{
                backgroundColor: PALETTE.white,
                color: PALETTE.ink,
                border: `1px solid ${PALETTE.lavender}`,
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full px-5 py-2 text-sm font-semibold transition-smooth"
              style={{
                backgroundColor: PALETTE.buttonDark,
                color: PALETTE.white,
              }}
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 pb-20 pt-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <section className="grid items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
            <div className="max-w-2xl">
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
                className="mt-6 font-display text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl"
                style={{ color: PALETTE.ink }}
              >
                Detect malnutrition early,
                <span className="block" style={{ color: "#5f5282" }}>
                  support families sooner,
                </span>
                <span className="block" style={{ color: "#7e719f" }}>
                  and protect childhood growth.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="mt-6 max-w-xl text-lg leading-8"
                style={{ color: "#4d4561" }}
              >
                Dhatu-Scan supports caregivers and health workers with a clear
                workflow for screening, data entry, risk detection, and early
                action for child nutrition care.
              </motion.p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/login"
                  className="rounded-full px-6 py-3 text-sm font-semibold transition-smooth"
                  style={{
                    backgroundColor: PALETTE.buttonDark,
                    color: PALETTE.white,
                  }}
                >
                  Open Login Page
                </Link>
                <Link
                  to="/register"
                  className="rounded-full px-6 py-3 text-sm font-semibold transition-smooth"
                  style={{
                    backgroundColor: PALETTE.white,
                    color: PALETTE.ink,
                    border: `1px solid ${PALETTE.lavender}`,
                  }}
                >
                  Open Registration Page
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.18 }}
              className="relative"
            >
              <div
                className="overflow-hidden rounded-[2rem] border p-3 shadow-xl"
                style={{
                  backgroundColor: "rgba(255, 250, 245, 0.68)",
                  borderColor: "rgba(156, 143, 203, 0.28)",
                  boxShadow: "0 24px 80px rgba(82, 69, 109, 0.12)",
                }}
              >
                <div className="relative overflow-hidden rounded-[1.5rem]">
                  <img
                    src="/assets/images/mother-child.jpeg"
                    alt="Mother taking care of her child"
                    className="h-[420px] w-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(244, 235, 223, 0.04) 0%, rgba(64, 53, 82, 0.28) 100%)",
                    }}
                  />
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <div
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{ backgroundColor: PALETTE.page, color: PALETTE.ink }}
                  >
                    Private-first support
                  </div>
                  <div
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{ backgroundColor: PALETTE.blue, color: "#314552" }}
                  >
                    Early family guidance
                  </div>
                  <div
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{ backgroundColor: PALETTE.lavender, color: "#45385f" }}
                  >
                    Better screening flow
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="py-12 lg:py-16">
            <SectionTitle
              eyebrow="Understanding The Risk"
              title="What every caregiver should know about malnutrition"
              description="These three questions explain why screening matters and why acting early can change outcomes for a child."
            />

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {INFO_CARDS.map((card, index) => (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.08 }}
                  className="flex min-h-[220px] flex-col rounded-[1.75rem] p-6 shadow-sm"
                  style={{
                    backgroundColor: card.tone,
                    color: card.text,
                  }}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">
                    Question {index + 1}
                  </p>
                  <h3 className="mt-4 font-display text-2xl font-semibold">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7">{card.desc}</p>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="py-12 lg:py-16">
            <SectionTitle
              eyebrow="How It Works"
              title="A clean step-by-step process in one aligned flow"
              description="From first screening to final result, each stage follows the next so caregivers can move through the process with clarity."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {STEPS.map((step, index) => (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + index * 0.08 }}
                  className="flex h-full min-h-[240px] flex-col rounded-[1.85rem] p-6 shadow-sm"
                  style={{ backgroundColor: step.bg, color: step.text }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold tracking-[0.24em] opacity-70">
                      {step.number}
                    </span>
                    <div
                      className="h-10 w-10 rounded-full"
                      style={{
                        backgroundColor: "rgba(255, 250, 245, 0.42)",
                      }}
                    />
                  </div>
                  <h3 className="mt-8 font-display text-2xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7">{step.desc}</p>
                </motion.article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
