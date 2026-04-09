import GlassCard from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import { clearAllData, exportData, getAssessments } from "@/utils/storage";
import {
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  Eye,
  HardDrive,
  Lock,
  Shield,
  ShieldCheck,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// ─── Privacy Pillar Data ───────────────────────────────────────────────
const PILLARS = [
  {
    icon: <Lock className="w-6 h-6" />,
    label: "On-Device AI",
    description:
      "All analysis happens locally on your device using browser-based AI. No data ever leaves your phone.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: <Eye className="w-6 h-6" />,
    label: "Face Masking",
    description:
      "Captured images are immediately blurred. No identifiable faces or personal images are ever stored.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  {
    icon: <Database className="w-6 h-6" />,
    label: "No Cloud Storage",
    description:
      "Zero data transmitted to any server. Everything stays on your device — always.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: <Trash2 className="w-6 h-6" />,
    label: "Auto Deletion",
    description:
      "Raw camera images are permanently deleted immediately after AI processing completes.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: <Wifi className="w-6 h-6" />,
    label: "Offline First",
    description:
      "Works without internet connection. Your data never needs to travel across any network.",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  {
    icon: <HardDrive className="w-6 h-6" />,
    label: "Local Encryption",
    description:
      "Sensitive health data stored with browser-level security. Only accessible on this device.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
];

// ─── Process Steps ────────────────────────────────────────────────────
const STEPS = [
  {
    step: 1,
    title: "Camera captures image locally",
    desc: "Image stays on your device's memory",
  },
  {
    step: 2,
    title: "AI processes on-device only",
    desc: "TensorFlow.js runs entirely in the browser",
  },
  {
    step: 3,
    title: "Raw image deleted immediately",
    desc: "No photo is stored anywhere after analysis",
  },
  {
    step: 4,
    title: "Only scores & metrics saved",
    desc: "Anonymised numerical data stored locally",
  },
  {
    step: 5,
    title: "You control all your data",
    desc: "Export or delete everything at any time",
  },
];

// ─── FAQ Data ─────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Can you see my child's photos?",
    a: "Absolutely not. Dhatu-Scan never uploads photos anywhere. All camera processing happens inside your browser using on-device AI. The raw image is deleted immediately after the AI extracts pose landmarks.",
  },
  {
    q: "Is my data shared with anyone?",
    a: "Never. There are no third-party analytics, no telemetry, no advertising SDKs. The only storage used is your own device's localStorage — fully isolated from the internet.",
  },
  {
    q: "What if I lose my phone?",
    a: "Since data is stored only locally on your device, it cannot be recovered remotely. We recommend using the Export Data feature to keep a JSON backup in a safe location before upgrading or switching devices.",
  },
  {
    q: "Can I delete everything?",
    a: "Yes — use the Data Control Center below. The 'Clear All Data' button permanently removes every assessment, child profile, and setting from your device. This action is irreversible.",
  },
];

// ─── Badge Component ──────────────────────────────────────────────────
function ComplianceBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10">
      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

// ─── FAQ Accordion Item ───────────────────────────────────────────────
function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <GlassCard variant="subtle" className="overflow-hidden">
        <button
          type="button"
          data-ocid={`faq-toggle-${index}`}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-smooth hover:bg-white/5"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="font-medium text-foreground">{q}</span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 text-muted-foreground"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3">
                {a}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function Privacy() {
  useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  const assessmentCount = getAssessments().length;
  const storageBytes = JSON.stringify(localStorage).length;
  const storageKB = (storageBytes / 1024).toFixed(1);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dhatu-scan-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClearConfirm() {
    clearAllData();
    setCleared(true);
    setShowConfirm(false);
  }

  return (
    <div className="min-h-screen gradient-hero pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-16">
        {/* ── HERO ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-5 pt-4"
        >
          {/* Animated shield */}
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 glow-teal mx-auto"
            animate={{
              boxShadow: [
                "0 0 20px oklch(0.72 0.18 176 / 0.25)",
                "0 0 40px oklch(0.72 0.18 176 / 0.5)",
                "0 0 20px oklch(0.72 0.18 176 / 0.25)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
          >
            <ShieldCheck className="w-10 h-10 text-primary" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Your Privacy, <span className="text-gradient-teal">Protected</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Dhatu-Scan runs entirely on your device. No data ever leaves your
            phone — not photos, not health records, not anything.
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            {["100% On-Device", "No Account Needed", "Works Offline"].map(
              (tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/25"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {tag}
                </span>
              ),
            )}
          </div>
        </motion.section>

        {/* ── PRIVACY PILLARS ── */}
        <section className="space-y-5">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-display font-semibold text-foreground"
          >
            Privacy Pillars
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PILLARS.map((pillar, i) => (
              <GlassCard
                key={pillar.label}
                animate
                delay={i * 0.08}
                hover
                variant="default"
                className="p-5 space-y-3"
              >
                <div
                  className={`inline-flex p-2.5 rounded-xl ${pillar.bg} border ${pillar.border}`}
                >
                  <span className={pillar.color}>{pillar.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    {pillar.label}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── HOW WE PROTECT ── */}
        <section className="space-y-5">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-display font-semibold text-foreground"
          >
            How We Protect Your Data
          </motion.h2>
          <div className="space-y-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full gradient-teal flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md">
                  {s.step}
                </div>
                <GlassCard variant="subtle" className="flex-1 p-4">
                  <p className="font-medium text-foreground text-sm">
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.desc}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── DATA CONTROL CENTER ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="space-y-5"
        >
          <h2 className="text-2xl font-display font-semibold text-foreground">
            Data Control Center
          </h2>
          <GlassCard variant="elevated" className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Assessments",
                  value: String(assessmentCount),
                  sub: "stored locally",
                },
                { label: "Last Backup", value: "N/A", sub: "local only" },
                {
                  label: "Storage Used",
                  value: `${storageKB} KB`,
                  sub: "on this device",
                },
              ].map((item) => (
                <div key={item.label} className="text-center space-y-0.5">
                  <p className="text-2xl font-display font-bold text-gradient-teal">
                    {item.value}
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                data-ocid="export-data-btn"
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/15 border border-primary/30 text-primary font-medium text-sm transition-smooth hover:bg-primary/25 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Download className="w-4 h-4" />
                Export Data (JSON)
              </button>
              <button
                type="button"
                data-ocid="clear-data-btn"
                onClick={() => setShowConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive font-medium text-sm transition-smooth hover:bg-destructive/25 hover:border-destructive/50 focus-visible:ring-2 focus-visible:ring-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
            </div>

            {cleared && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                All data cleared. The page will reset on next visit.
              </motion.div>
            )}
          </GlassCard>
        </motion.section>

        {/* ── COMPLIANCE SECTION ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >
          <h2 className="text-2xl font-display font-semibold text-foreground">
            Compliance &amp; Standards
          </h2>
          <GlassCard variant="default" className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <p className="font-medium text-foreground">
                Compliant with healthcare data principles
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ComplianceBadge label="HIPAA-Inspired" />
              <ComplianceBadge label="GDPR-Inspired" />
              <ComplianceBadge label="WHO Guidelines" />
              <ComplianceBadge label="Privacy by Design" />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-3 leading-relaxed">
              <strong className="text-foreground">Disclaimer:</strong>{" "}
              Dhatu-Scan is not legally certified under HIPAA or GDPR. These
              badges represent our commitment to privacy-by-design principles
              inspired by those regulations. This app is a healthcare prototype
              intended for educational and research use.
            </p>
          </GlassCard>
        </motion.section>

        {/* ── FAQ ACCORDION ── */}
        <section className="space-y-4 pb-6">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-display font-semibold text-foreground"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </section>
      </div>

      {/* ── CONFIRM DIALOG ── */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass-card card-elevated rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/20 border border-destructive/30 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Clear All Data?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid="confirm-close-btn"
                  onClick={() => setShowConfirm(false)}
                  className="text-muted-foreground hover:text-foreground transition-smooth mt-0.5"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                This will permanently delete all child profiles, assessments,
                and settings from this device. Make sure to export your data
                first if you want a backup.
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  data-ocid="cancel-clear-btn"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium transition-smooth hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-ocid="confirm-clear-btn"
                  onClick={handleClearConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive text-sm font-medium transition-smooth hover:bg-destructive/30 focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  Delete Everything
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
