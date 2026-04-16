import { useApp } from "@/context/AppContext";
import { Link, Navigate } from "@tanstack/react-router";
import { ChevronUp, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import GlobeHero from "@/components/GlobeHero";

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

const AFTEREFFECTS = [
  {
    value: "150.2 million",
    detail: "children under 5 are affected by poor growth worldwide",
  },
  {
    value: "2.25 million",
    detail: "deaths of children under 5 are linked to undernutrition",
  },
  {
    value: "2.1%",
    detail: "is the slow yearly improvement, which still is not enough",
  },
  {
    value: "0 to 10 years",
    detail: "is the age group most severely affected by malnutrition",
  },
];

const QUICK_LINKS = [
  {
    label: "LinkedIn",
    value: "linkedin.com/in/dhatu-scan",
    icon: Linkedin,
  },
  {
    label: "Instagram",
    value: "@dhatuscan.health",
    icon: Instagram,
  },
  {
    label: "Contact Number",
    value: "9999999999",
    icon: Phone,
  },
  {
    label: "Email ID",
    value: "hello@dhatuscan.org",
    icon: Mail,
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
  darkPage: "#0a0a0a",
  darkPanel: "#1a1a1a",
  darkBlue: "#2a2a2a",
  darkLavender: "#3a3a3a",
  darkPurple: "#4a4a4a",
  darkInk: "#e0e0e0",
  darkMuted: "#a0a0a0",
  darkHeadingAccent: "#808080",
  darkHeadingSoft: "#b0b0b0",
  darkBorder: "rgba(128, 128, 128, 0.3)",
  darkFooter: "#3a2b53",
};

function SectionTitle({
  eyebrow,
  title,
  description,
  isDark = false,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  isDark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p
          className="text-base font-semibold uppercase tracking-[0.22em]"
          style={{ color: isDark ? PALETTE.darkHeadingAccent : PALETTE.muted }}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`${eyebrow ? "mt-4" : ""} font-display text-3xl font-bold sm:text-4xl`}
        style={{ color: isDark ? PALETTE.darkHeadingSoft : PALETTE.ink }}
      >
        {title}
      </h2>
      {description ? (
        <p
          className="mt-4 text-base leading-7"
          style={{ color: isDark ? PALETTE.darkMuted : "#4d4561" }}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function AuthPage() {
  const { state } = useApp();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const pageBackground = isDark
    ? "radial-gradient(circle at top left, rgba(72, 91, 123, 0.22) 0%, rgba(72, 91, 123, 0) 30%), radial-gradient(circle at top right, rgba(156, 143, 203, 0.2) 0%, rgba(156, 143, 203, 0) 34%), linear-gradient(180deg, #151821 0%, #1b202b 48%, #151821 100%)"
    : "radial-gradient(circle at top left, rgba(181, 209, 218, 0.45) 0%, rgba(181, 209, 218, 0) 30%), radial-gradient(circle at top right, rgba(184, 164, 204, 0.32) 0%, rgba(184, 164, 204, 0) 34%), linear-gradient(180deg, #f4ebdf 0%, #efe3d4 48%, #f4ebdf 100%)";
  const navbarBackground = isDark ? "rgba(31, 36, 48, 0.88)" : "rgba(255, 250, 245, 0.78)";
  const navbarBorder = isDark ? PALETTE.darkBorder : "rgba(156, 143, 203, 0.22)";
  const navbarShadow = isDark
    ? "0 14px 36px rgba(0, 0, 0, 0.28)"
    : "0 14px 36px rgba(82, 69, 109, 0.08)";
  const primaryText = isDark ? PALETTE.darkInk : PALETTE.ink;
  const mutedText = isDark ? PALETTE.darkMuted : PALETTE.muted;
  const badgeBackground = isDark ? "rgba(255, 250, 245, 0.08)" : PALETTE.white;
  const badgeBorder = isDark ? PALETTE.darkBorder : PALETTE.lavender;
  const heroCardBackground = isDark ? "rgba(31, 36, 48, 0.72)" : "rgba(255, 250, 245, 0.68)";
  const heroCardBorder = isDark ? PALETTE.darkBorder : "rgba(156, 143, 203, 0.28)";
  const heroOverlay = isDark
    ? "linear-gradient(180deg, rgba(21, 24, 33, 0.04) 0%, rgba(21, 24, 33, 0.44) 100%)"
    : "linear-gradient(180deg, rgba(244, 235, 223, 0.04) 0%, rgba(64, 53, 82, 0.28) 100%)";
  const infoCardTones = isDark
    ? [PALETTE.darkPanel, PALETTE.darkBlue, PALETTE.darkLavender]
    : INFO_CARDS.map((card) => card.tone);
  const infoCardText = isDark
    ? [PALETTE.darkInk, PALETTE.darkInk, PALETTE.darkInk]
    : INFO_CARDS.map((card) => card.text);
  const stepCardTones = isDark
    ? [PALETTE.darkPanel, PALETTE.darkBlue, PALETTE.darkLavender, PALETTE.darkPurple]
    : STEPS.map((step) => step.bg);
  const stepCardText = isDark
    ? [PALETTE.darkInk, PALETTE.darkInk, PALETTE.darkInk, PALETTE.white]
    : STEPS.map((step) => step.text);
  const footerBackground = isDark ? PALETTE.darkFooter : "#52456d";

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: pageBackground,
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

      <header className="px-4 py-6 sm:px-6 lg:px-10">
        <div
          className="mx-auto flex max-w-7xl items-center justify-between"
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
                style={{ color: primaryText }}
              >
                Dhatu-Scan
              </div>
              <p className="text-xs" style={{ color: mutedText }}>
                Early malnutrition detection support
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
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

      <main className="px-4 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <section className="grid items-center gap-10 py-8 lg:grid-cols-[1fr_1fr] lg:py-14 lg:pl-8">
            <div className="max-w-2xl lg:ml-4">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
                style={{
                  backgroundColor: badgeBackground,
                  color: primaryText,
                  border: `1px solid ${badgeBorder}`,
                }}
              >
                Child Nutrition Screening Platform
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mt-2 font-display text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl"
                style={{ color: primaryText }}
              >
                Turning hidden signs into
                <span
                  className="block"
                  style={{ color: isDark ? PALETTE.darkHeadingAccent : "#5f5282" }}
                >
                  lifesaving insights
                </span>
                <span
                  className="block mt-6 text-3xl font-bold"
                  style={{ color: isDark ? PALETTE.darkHeadingAccent : "#5f5282" }}
                >
                  with privacy-first AI
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="mt-8"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-smooth"
                  style={{
                    background: "linear-gradient(135deg, #9c8fcb, #7c6ba8)",
                    boxShadow: "0 0 24px rgba(156, 143, 203, 0.35)",
                  }}
                >
                  <span className="relative z-10">Start Screening</span>
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: "rgba(156, 143, 203, 0.2)" }}
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>

            </div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.18 }}
              className="relative"
            >
              <GlobeHero />
            </motion.div>
          </section>

          <section className="py-12 lg:py-16">
            <SectionTitle
              eyebrow="The 3 Q&apos;s"
              title="What every caregiver should know about malnutrition"
              isDark={isDark}
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
                    backgroundColor: infoCardTones[index % infoCardTones.length],
                    color: infoCardText[index % infoCardText.length],
                  }}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">
                    Question {index + 1}
                  </p>
                  <h3 className="mt-4 font-display text-2xl font-medium">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-base leading-7">{card.desc}</p>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="py-12 lg:py-16">
            <SectionTitle
              eyebrow="Aftereffects Of Malnutrition"
              title="Why delayed action becomes dangerous"
              isDark={isDark}
            />

            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {AFTEREFFECTS.map((item, index) => (
                <motion.article
                  key={item.value}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.08 }}
                  className="mx-auto flex aspect-square w-full max-w-[260px] flex-col items-center justify-center rounded-full border-[5px] px-7 py-6 text-center shadow-sm"
                  style={{
                    backgroundColor: infoCardTones[index % infoCardTones.length],
                    color: infoCardText[index % infoCardText.length],
                    borderColor: "#d05c5c",
                  }}
                >
                  <p className="text-[2.2rem] font-display font-bold leading-none sm:text-[2.8rem]">
                    {item.value}
                  </p>
                  <p className="mt-4 max-w-[10.5rem] text-[12px] leading-5 sm:text-[13px]">
                    {item.detail}
                  </p>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="py-12 lg:py-16">
            <SectionTitle
              eyebrow="How It Works"
              title="A clean step-by-step process in one aligned flow"
              isDark={isDark}
            />

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {STEPS.map((step, index) => (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + index * 0.08 }}
                  className="flex h-full min-h-[240px] flex-col rounded-[1.85rem] p-6 shadow-sm"
                  style={{
                    backgroundColor: stepCardTones[index % stepCardTones.length],
                    color: stepCardText[index % stepCardText.length],
                  }}
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

      <section
        className="relative left-1/2 w-screen -translate-x-1/2 px-4 pb-16 pt-14 sm:px-6 lg:px-10"
        style={{ backgroundColor: footerBackground, color: PALETTE.white }}
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Stay connected with Dhatu-Scan
          </h2>

          <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="pt-2">
                    <p className="text-sm leading-7 opacity-90">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="mt-12 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition-smooth hover:text-white"
          >
            <ChevronUp className="h-4 w-4" />
            Go to top
          </button>

          <div className="h-8" />
        </div>
      </section>
    </div>
  );
}
