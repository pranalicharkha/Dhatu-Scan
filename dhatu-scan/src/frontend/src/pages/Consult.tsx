import GlassCard from "@/components/GlassCard";

const CONSULT_OPTIONS = [
  {
    title: "Book a Pediatrician",
    desc: "Prepare symptoms, screening results, and growth history before visiting a doctor.",
  },
  {
    title: "Nutrition Specialist",
    desc: "Get feeding plans, diet advice, and household nutrition support recommendations.",
  },
  {
    title: "NGO / Community Worker",
    desc: "Find practical support for supplements, local screening camps, and follow-up visits.",
  },
];

const CHECKLIST = [
  "Carry the latest result summary and child growth data.",
  "Note changes in appetite, weight, fever, or weakness.",
  "Discuss safe water, feeding diversity, and next follow-up date.",
];

export default function Consult() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <GlassCard variant="elevated" className="p-8 rounded-[2rem]">
          <p className="text-sm uppercase tracking-[0.24em] text-primary">
            Consult
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold text-foreground">
            Go to a doctor and plan the next care step.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/66">
            This section is for professional follow-up. Use it when you want to
            move from screening into real-world medical advice, nutrition care, or
            community support.
          </p>
        </GlassCard>

        <div className="grid gap-5 md:grid-cols-3">
          {CONSULT_OPTIONS.map((item) => (
            <GlassCard key={item.title} variant="elevated" className="p-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground/62">
                {item.desc}
              </p>
              <button
                type="button"
                className="mt-6 rounded-full gradient-teal px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-teal"
              >
                Open Support Path
              </button>
            </GlassCard>
          ))}
        </div>

        <GlassCard variant="elevated" className="p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-foreground/45">
            Before You Visit
          </p>
          <div className="mt-5 grid gap-3">
            {CHECKLIST.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground/68"
              >
                {item}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
