import GlassCard from "@/components/GlassCard";
import { Link } from "@tanstack/react-router";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay },
  }),
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  children,
  className = "",
  id,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section id={id} ref={ref} className={className} style={style}>
      {children}
    </section>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedStat({
  value,
  label,
  icon,
  delay,
}: {
  value: string;
  label: string;
  icon: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <GlassCard
        variant="elevated"
        hover
        className="p-6 text-center flex flex-col items-center gap-3"
      >
        <span className="text-4xl" role="img" aria-hidden="true">
          {icon}
        </span>
        <span className="text-3xl font-display font-bold text-gradient-teal">
          {value}
        </span>
        <span className="text-sm text-foreground/60 font-medium">{label}</span>
      </GlassCard>
    </motion.div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({
  step,
  title,
  desc,
  icon,
  delay,
}: {
  step: number;
  title: string;
  desc: string;
  icon: string;
  delay: number;
}) {
  return (
    <GlassCard
      animate
      delay={delay}
      hover
      variant="elevated"
      className="p-6 flex flex-col gap-4 relative"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center text-white font-bold text-sm shrink-0 glow-teal">
          {step}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h3 className="font-display font-semibold text-foreground mb-1">
          {title}
        </h3>
        <p className="text-sm text-foreground/60 leading-relaxed">{desc}</p>
      </div>
    </GlassCard>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "📸",
    title: "Camera AI Analysis",
    desc: "Real-time pose detection and body proportion analysis using your smartphone camera — no special equipment needed.",
    glow: "teal" as const,
  },
  {
    icon: "📊",
    title: "WHO Growth Standards",
    desc: "Validated Z-score calculations based on WHO child growth standards for height, weight, and age.",
    glow: "blue" as const,
  },
  {
    icon: "📶",
    title: "Offline-First",
    desc: "Full functionality without internet. All processing happens on your device — no cloud required.",
    glow: "green" as const,
  },
  {
    icon: "🔒",
    title: "Privacy Shield",
    desc: "On-device AI, automatic face masking, zero cloud uploads. Your child's data never leaves your device.",
    glow: "none" as const,
  },
  {
    icon: "📈",
    title: "Growth Tracking",
    desc: "Longitudinal charts tracking height, weight, and Z-score trends over time with improvement insights.",
    glow: "teal" as const,
  },
  {
    icon: "🎮",
    title: "Kid Gamification",
    desc: "A supportive rewards system with XP, badges, and human avatar milestones - from Starting Point to Thriving.",
    glow: "green" as const,
  },
];

// ─── Problem cards ────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    icon: "😰",
    title: "Silent Crisis",
    desc: "Malnutrition often shows no obvious symptoms until it becomes severe, making early detection critical.",
  },
  {
    icon: "🏥",
    title: "Limited Access",
    desc: "Billions of people lack access to healthcare facilities equipped for nutritional assessment.",
  },
  {
    icon: "⏱️",
    title: "Late Diagnosis",
    desc: "By the time malnutrition is clinically diagnosed, irreversible developmental damage may already have occurred.",
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    initials: "SP",
    name: "Sunita Patel",
    role: "Parent",
    location: "Rajasthan",
    quote:
      "Dhatu-Scan helped me track my daughter's growth at home. The clear risk scores gave me confidence to seek timely medical advice.",
    color: "from-teal-500 to-cyan-400",
  },
  {
    initials: "DR",
    name: "Dr. Rohan Mehta",
    role: "Pediatrician",
    location: "Mumbai",
    quote:
      "An impressive tool for community health workers. The WHO Z-score integration and dietary scoring make it clinically meaningful.",
    color: "from-blue-500 to-violet-400",
  },
  {
    initials: "AM",
    name: "Ananya Mishra",
    role: "NGO Field Worker",
    location: "Odisha",
    quote:
      "We use Dhatu-Scan in villages with no internet. Offline-first design is a game changer for rural child health programs.",
    color: "from-emerald-500 to-teal-400",
  },
];

// ─── Scan visualization ────────────────────────────────────────────────────────
function HeroVisualization() {
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
      {/* Outer pulsing rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-teal-500/20"
          style={{
            width: `${60 + i * 20}%`,
            height: `${60 + i * 20}%`,
          }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{
            duration: 2.5 + i * 0.5,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.4,
          }}
        />
      ))}

      {/* Rotating scan ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "70%",
          height: "70%",
          background:
            "conic-gradient(from 0deg, transparent 270deg, oklch(0.72 0.18 176 / 0.6) 360deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />

      {/* Hero image container */}
      <div
        className="relative z-10 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: "58%",
          height: "58%",
          background:
            "radial-gradient(circle, oklch(0.15 0.02 250) 0%, oklch(0.09 0.015 250) 100%)",
          border: "1px solid oklch(0.72 0.18 176 / 0.3)",
          boxShadow: "0 0 40px oklch(0.72 0.18 176 / 0.25)",
        }}
      >
        <img
          src="/assets/generated/hero-health-scan.dim_800x800.png"
          alt="AI Health Scan Visualization"
          className="w-full h-full object-cover opacity-80"
        />
        {/* Scan line animation */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, transparent 0%, oklch(0.72 0.18 176 / 0.15) 50%, transparent 100%)",
            backgroundSize: "100% 30px",
          }}
          animate={{ backgroundPositionY: ["0%", "100%"] }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating data badges */}
      {[
        { label: "Height ✓", pos: { top: "8%", right: "5%" }, delay: 0 },
        {
          label: "BMI: Normal",
          pos: { bottom: "12%", left: "2%" },
          delay: 0.5,
        },
        {
          label: "Z-Score: −0.4",
          pos: { bottom: "5%", right: "8%" },
          delay: 1,
        },
      ].map(({ label, pos, delay }) => (
        <motion.div
          key={label}
          className="absolute text-xs font-mono px-2 py-1 rounded-md"
          style={{
            ...pos,
            background: "oklch(0.13 0.018 250 / 0.9)",
            border: "1px solid oklch(0.72 0.18 176 / 0.4)",
            color: "oklch(0.82 0.18 176)",
          }}
          animate={{ opacity: [0.6, 1, 0.6], y: [-2, 2, -2] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            delay,
          }}
        >
          {label}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center gradient-hero pt-20 pb-16"
        data-ocid="hero-section"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text content */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              {/* Badge */}
              <motion.div
                custom={0}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-2 mb-6"
              >
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase"
                  style={{
                    background: "oklch(0.72 0.18 176 / 0.15)",
                    border: "1px solid oklch(0.72 0.18 176 / 0.4)",
                    color: "oklch(0.82 0.18 176)",
                  }}
                >
                  🏥 Healthcare AI · Hackathon 2026
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                custom={0.1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-none mb-4"
              >
                <span className="text-gradient-teal">Dhatu-Scan</span>
              </motion.h1>

              <motion.p
                custom={0.2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-xl sm:text-2xl font-display font-semibold text-foreground/80 mb-4"
              >
                AI Powered Child Malnutrition Detection
              </motion.p>

              <motion.p
                custom={0.3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-base text-foreground/55 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
              >
                A privacy-first platform that helps parents, caregivers, and
                NGOs detect malnutrition early using smartphone camera analysis,
                WHO growth standards, and dietary risk assessment. No cloud. No
                data sharing. Just care.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                custom={0.45}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link
                  to="/form"
                  data-ocid="cta-start-assessment"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-smooth overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.18 176), oklch(0.65 0.17 210))",
                    boxShadow: "0 0 24px oklch(0.72 0.18 176 / 0.35)",
                  }}
                >
                  <span className="relative z-10">🚀 Start Assessment</span>
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: "oklch(0.72 0.18 176 / 0.2)" }}
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
                <Link
                  to="/camera"
                  data-ocid="cta-view-demo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-foreground/90 text-base transition-smooth"
                  style={{
                    border: "1px solid oklch(0.72 0.18 176 / 0.4)",
                    background: "oklch(0.72 0.18 176 / 0.08)",
                  }}
                >
                  📷 View Demo
                </Link>
              </motion.div>

              {/* Social proof micro */}
              <motion.div
                custom={0.55}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="mt-8 flex items-center gap-4 justify-center lg:justify-start text-sm text-foreground/40"
              >
                <span>✅ 100% On-Device</span>
                <span>·</span>
                <span>✅ WHO Validated</span>
                <span>·</span>
                <span>✅ Works Offline</span>
              </motion.div>
            </div>

            {/* Right: Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="order-1 lg:order-2 flex justify-center"
            >
              <HeroVisualization />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.button
          onClick={() => scrollToSection("stats")}
          aria-label="Scroll to stats"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-foreground/30 text-xs hover:text-foreground/60 transition-smooth"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
        >
          <span>Scroll</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 10.586L2.707 5.293 1.293 6.707 8 13.414l6.707-6.707-1.414-1.414z" />
          </svg>
        </motion.button>
      </section>

      {/* ── STATS ── */}
      <Section
        id="stats"
        className="py-16 relative"
        style={
          { background: "oklch(0.11 0.018 250 / 0.6)" } as React.CSSProperties
        }
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatedStat
              value="92%"
              label="Simulated Accuracy"
              icon="🎯"
              delay={0}
            />
            <AnimatedStat
              value="100%"
              label="Offline Support"
              icon="📶"
              delay={0.1}
            />
            <AnimatedStat
              value="WHO"
              label="Growth Standards"
              icon="🌍"
              delay={0.2}
            />
            <AnimatedStat
              value="0 KB"
              label="Cloud Uploads"
              icon="🔒"
              delay={0.3}
            />
          </div>
        </div>
      </Section>

      {/* ── PROBLEM STATEMENT ── */}
      <Section id="problem" className="py-20 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3 block">
              Why It Matters
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              The Challenge We{" "}
              <span className="text-gradient-teal">Cannot Ignore</span>
            </h2>
            <p className="text-foreground/55 max-w-2xl mx-auto text-base leading-relaxed">
              149 million children under 5 suffer from stunting globally. Nearly
              50 million are acutely malnourished. Yet most go undetected until
              it is too late.
            </p>
          </motion.div>

          {/* Big stat highlight */}
          <GlassCard
            animate
            variant="elevated"
            className="p-8 mb-10 text-center"
            style={
              {
                borderColor: "oklch(0.72 0.18 176 / 0.3)",
              } as React.CSSProperties
            }
          >
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
            >
              {[
                { n: "149M", label: "children stunted globally" },
                { n: "49M", label: "children acutely wasted" },
                { n: "45%", label: "of child deaths linked to malnutrition" },
              ].map(({ n, label }) => (
                <div key={n} className="text-center">
                  <div className="text-4xl font-display font-bold text-gradient-teal">
                    {n}
                  </div>
                  <div className="text-sm text-foreground/50 mt-1">{label}</div>
                </div>
              ))}
            </motion.div>
          </GlassCard>

          <div className="grid sm:grid-cols-3 gap-5">
            {PROBLEMS.map(({ icon, title, desc }, i) => (
              <GlassCard
                key={title}
                animate
                delay={i * 0.12}
                hover
                variant="elevated"
                className="p-6"
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {title}
                </h3>
                <p className="text-sm text-foreground/55 leading-relaxed">
                  {desc}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section
        id="how-it-works"
        className="py-20 relative"
        style={
          { background: "oklch(0.11 0.018 250 / 0.5)" } as React.CSSProperties
        }
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3 block">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              How <span className="text-gradient-teal">Dhatu-Scan</span> Works
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connecting line (desktop) */}
            <div
              className="absolute top-10 left-[12%] right-[12%] h-px hidden lg:block"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.72 0.18 176 / 0.3), oklch(0.72 0.18 176 / 0.3), transparent)",
              }}
            />

            <StepCard
              step={1}
              icon="📸"
              title="Camera Analysis"
              desc="Point your smartphone camera at the child. Our AI detects body proportions and pose landmarks in real time."
              delay={0}
            />
            <StepCard
              step={2}
              icon="📝"
              title="Child Details"
              desc="Enter age, height, weight, dietary habits, and water source. Multi-step form with guided validation."
              delay={0.12}
            />
            <StepCard
              step={3}
              icon="🧠"
              title="AI Assessment"
              desc="The engine fuses wasting scores with dietary risk using WHO Z-score simulation to compute a final risk level."
              delay={0.24}
            />
            <StepCard
              step={4}
              icon="📋"
              title="Results & Guidance"
              desc="Receive color-coded risk level, WHO status, improvement recommendations, and shareable report."
              delay={0.36}
            />
          </div>
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section id="features" className="py-20 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3 block">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Everything You Need in{" "}
              <span className="text-gradient-health">One App</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc, glow }, i) => (
              <GlassCard
                key={title}
                animate
                delay={i * 0.08}
                hover
                variant="elevated"
                glow={glow}
                className="p-6 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-smooth inline-block">
                  {icon}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {title}
                </h3>
                <p className="text-sm text-foreground/55 leading-relaxed">
                  {desc}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section
        id="testimonials"
        className="py-20 relative"
        style={
          { background: "oklch(0.11 0.018 250 / 0.5)" } as React.CSSProperties
        }
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3 block">
              Real Impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Trusted by <span className="text-gradient-teal">Communities</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(
              ({ initials, name, role, location, quote, color }, i) => (
                <GlassCard
                  key={name}
                  animate
                  delay={i * 0.12}
                  hover
                  variant="elevated"
                  className="p-6 flex flex-col gap-4"
                >
                  {/* Quote */}
                  <p className="text-sm text-foreground/70 leading-relaxed flex-1 italic">
                    "{quote}"
                  </p>
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-sm truncate">
                        {name}
                      </div>
                      <div className="text-xs text-foreground/45 truncate">
                        {role} · {location}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ),
            )}
          </div>
        </div>
      </Section>

      {/* ── CTA BANNER ── */}
      <Section className="py-16 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <GlassCard
            animate
            variant="elevated"
            className="p-10 text-center relative overflow-hidden"
            style={
              {
                borderColor: "oklch(0.72 0.18 176 / 0.25)",
              } as React.CSSProperties
            }
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, oklch(0.72 0.18 176) 0%, transparent 70%)",
              }}
            />
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative z-10"
            >
              <div className="text-4xl mb-4">🌱</div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
                Start Detecting Early. Start Saving Lives.
              </h2>
              <p className="text-foreground/55 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
                Join thousands of parents and healthcare workers using
                Dhatu-Scan to protect children's futures — completely free,
                completely private.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/form"
                  data-ocid="cta-banner-start"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-smooth"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.18 176), oklch(0.65 0.17 210))",
                    boxShadow: "0 0 24px oklch(0.72 0.18 176 / 0.3)",
                  }}
                >
                  🚀 Begin Free Assessment
                </Link>
                <Link
                  to="/privacy"
                  data-ocid="cta-banner-privacy"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-foreground/70 text-base transition-smooth"
                  style={{ border: "1px solid oklch(0.72 0.18 176 / 0.25)" }}
                >
                  🔒 Privacy Commitment
                </Link>
              </div>
            </motion.div>
          </GlassCard>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer
        className="py-12 border-t border-white/8 relative"
        style={{ background: "oklch(0.09 0.015 250)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🌱</span>
                <span className="font-display font-bold text-xl text-gradient-teal">
                  Dhatu-Scan
                </span>
              </div>
              <p className="text-sm text-foreground/45 leading-relaxed">
                AI-powered early malnutrition detection for every child,
                everywhere.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-semibold text-foreground/70 text-sm mb-3 uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-2">
                {[
                  { label: "Start Assessment", to: "/form" },
                  { label: "Camera Analysis", to: "/camera" },
                  { label: "Growth History", to: "/history" },
                  { label: "Gamification", to: "/gamification" },
                  { label: "Privacy", to: "/privacy" },
                ].map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-foreground/45 hover:text-foreground/80 transition-smooth"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Privacy commitment */}
            <div>
              <h4 className="font-semibold text-foreground/70 text-sm mb-3 uppercase tracking-wider">
                Privacy Commitment
              </h4>
              <ul className="space-y-1.5 text-sm text-foreground/45">
                <li>🔒 All data stored locally</li>
                <li>📵 Zero cloud uploads</li>
                <li>🎭 Automatic face masking</li>
                <li>🤖 On-device AI only</li>
                <li>🗑️ Delete anytime</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground/30">
            <span>
              © {new Date().getFullYear()} Dhatu-Scan. Built with love for
              children's health.
            </span>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground/60 transition-smooth"
            >
              Built with caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}


