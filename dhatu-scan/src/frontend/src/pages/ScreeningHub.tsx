import GlassCard from "@/components/GlassCard";
import { Link } from "@tanstack/react-router";

const STEPS = [
  {
    title: "Camera Screening",
    desc: "Use the phone camera workflow for the visual scan step.",
    to: "/camera",
    cta: "Open Camera",
  },
  {
    title: "Child Details",
    desc: "Enter age, height, weight, diet, and household details.",
    to: "/form",
    cta: "Open Form",
  },
  {
    title: "See Results",
    desc: "Move directly to results after a completed screening session.",
    to: "/results",
    cta: "Open Results",
  },
];

export default function ScreeningHub() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <GlassCard variant="elevated" className="p-8 rounded-[2rem]">
          <p className="text-sm uppercase tracking-[0.24em] text-primary">
            Screening
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold text-foreground">
            Run the screening flow in a cleaner way.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/66">
            This section groups the scan experience so the sidebar stays simple.
            Start from camera, complete the child details, and then review the
            generated results and statistics.
          </p>
        </GlassCard>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <GlassCard key={step.title} variant="elevated" className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-teal text-sm font-bold text-primary-foreground shadow-glow-teal">
                {index + 1}
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground/62">
                {step.desc}
              </p>
              <Link
                to={step.to}
                className="mt-6 inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-smooth hover:bg-primary/15"
              >
                {step.cta}
              </Link>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
