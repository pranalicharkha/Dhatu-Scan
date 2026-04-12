import GlassCard from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import type {
  Assessment,
  ChildProfile,
  Gender,
  WaterSourceType,
} from "@/types/index";
import {
  isBackendConfigured,
  submitAssessmentToBackend,
} from "@/lib/backendApi";
import {
  calculateBMI,
  calculateDietaryScore,
  calculateFinalScore,
  calculateWHOZScore,
  calculateWastingScore,
  getRiskCategory,
  waterSourceToScore,
} from "@/utils/assessmentLogic";
/**
 * Form.tsx — Multi-step Child Details Form
 * Steps: 1) Child Info  2) Body Measurements  3) Dietary Assessment  4) Lifestyle
 */
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// ─── Local form state shape ────────────────────────────────────────────────────
interface FormState {
  // Step 1
  childName: string;
  ageYears: string;
  gender: Gender;
  // Step 2
  height: string;
  weight: string;
  // Step 3
  dietDiversity: number;
  waterSourceType: WaterSourceType;
  recentDiarrhea: boolean;
  // Step 4
  breastfed: boolean;
  vaccinationStatus: "up_to_date" | "partial" | "not_vaccinated";
  medicalConditions: string;
}

const INITIAL_FORM: FormState = {
  childName: "",
  ageYears: "",
  gender: "male",
  height: "",
  weight: "",
  dietDiversity: 5,
  waterSourceType: "piped",
  recentDiarrhea: false,
  breastfed: false,
  vaccinationStatus: "up_to_date",
  medicalConditions: "",
};

// ─── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { title: "Child Info", description: "Basic information about the child" },
  { title: "Body Measurements", description: "Height, weight & BMI check" },
  { title: "Dietary Assessment", description: "Food, water & health habits" },
  { title: "Lifestyle Details", description: "Additional health context" },
];

const WATER_SOURCE_OPTIONS: {
  value: WaterSourceType;
  label: string;
  icon: string;
}[] = [
  { value: "piped", label: "Tap / Piped Water", icon: "🚿" },
  { value: "borehole", label: "Borehole / Well", icon: "🪣" },
  { value: "surface", label: "River / Surface", icon: "🌊" },
  { value: "unprotected", label: "Unprotected Source", icon: "⚠️" },
];

const DIET_DIVERSITY_LABELS: Record<number, string> = {
  1: "Very Limited",
  2: "Very Limited",
  3: "Limited",
  4: "Below Average",
  5: "Moderate",
  6: "Moderate",
  7: "Good",
  8: "Good",
  9: "Diverse",
  10: "Very Diverse",
};

// ─── BMI helper ────────────────────────────────────────────────────────────────
function getBMICategory(bmi: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (bmi === 0)
    return { label: "—", color: "text-muted-foreground", bg: "bg-muted/20" };
  if (bmi < 14)
    return {
      label: "Severely Underweight",
      color: "text-red-400",
      bg: "bg-red-500/10",
    };
  if (bmi < 16)
    return {
      label: "Underweight",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    };
  if (bmi < 25)
    return {
      label: "Normal Range",
      color: "text-green-400",
      bg: "bg-green-500/10",
    };
  return {
    label: "Above Normal",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  };
}

// ─── Input styling ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 transition-smooth";
const errorCls = "text-red-400 text-xs mt-1";
const labelCls = "block text-sm font-medium text-muted-foreground mb-2";

// ─── Step animations ───────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function Form() {
  const navigate = useNavigate();
  const { addChild, updateChild, addAssessment, state } = useApp();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validateStep(s: number): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};

    if (s === 0) {
      if (!form.childName.trim()) errs.childName = "Child name is required";
      const age = Number(form.ageYears);
      if (!form.ageYears || Number.isNaN(age) || age < 0 || age > 17)
        errs.ageYears = "Enter age between 0 and 17 years";
    }

    if (s === 1) {
      const h = Number(form.height);
      const w = Number(form.weight);
      if (!form.height || Number.isNaN(h) || h < 30 || h > 200)
        errs.height = "Height must be between 30 and 200 cm";
      if (!form.weight || Number.isNaN(w) || w < 2 || w > 150)
        errs.weight = "Weight must be between 2 and 150 kg";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep((s) => s + 1);
  }

  function handleBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const ageMonths = Math.round(Number(form.ageYears) * 12);
      const h = Number(form.height);
      const w = Number(form.weight);

      // Find or create child profile
      const existingChild = state.children.find(
        (c) => c.name.toLowerCase() === form.childName.trim().toLowerCase(),
      );

      const now = new Date().toISOString();
      const childId = existingChild?.id ?? crypto.randomUUID();

      const childProfile: ChildProfile = {
        id: childId,
        name: form.childName.trim(),
        age: ageMonths,
        gender: form.gender,
        height: h,
        weight: w,
        createdAt: existingChild?.createdAt ?? now,
        updatedAt: now,
      };
      if (existingChild) updateChild(childProfile);
      else addChild(childProfile);

      const waterScore = waterSourceToScore(form.waterSourceType);
      const diarrheaScore = form.recentDiarrhea ? 0 : 10;

      let wastingScore = 0;
      let dietaryScore = 0;
      let finalScore = 0;
      let riskLevel: Assessment["riskLevel"] = "moderate";
      let whoZScore = 0;
      let whoStatus: Assessment["whoStatus"] = "normal";
      let waz: Assessment["waz"];
      let haz: Assessment["haz"];
      let whz: Assessment["whz"];
      let baz: Assessment["baz"];
      let underweightStatus: Assessment["underweightStatus"];
      let stuntingStatus: Assessment["stuntingStatus"];
      let wastingStatus: Assessment["wastingStatus"];
      let usedBackend = false;

      if (isBackendConfigured()) {
        try {
          const backendResult = await submitAssessmentToBackend({
            childId,
            childName: form.childName.trim(),
            ageMonths,
            gender: form.gender,
            heightCm: h,
            weightKg: w,
            dietDiversity: form.dietDiversity,
            waterSourceType: form.waterSourceType,
            recentDiarrhea: form.recentDiarrhea,
            diarrheaFrequency: form.recentDiarrhea ? 10 : 0,
            breastfed: form.breastfed,
            captureMode: "upload",
            bodyLandmarksDetected: 0,
            faceLandmarksDetected: 0,
            faceMasked: false,
            modelName: "frontend-form",
            modelConfidence: 0.75,
          });

          wastingScore = backendResult.scores.wastingScore;
          dietaryScore = backendResult.scores.dietaryScore;
          finalScore = backendResult.scores.fusionScore;
          riskLevel = backendResult.scores.riskLevel;
          whoZScore = backendResult.scores.whoZScore;
          whoStatus = backendResult.scores.whoStatus;
          usedBackend = true;
        } catch (error) {
          console.warn("Backend assessment failed; using local scoring fallback.", error);
        }
      }

      if (!usedBackend) {
        // Fallback to local calculations when backend is unavailable.
        const bmi = calculateBMI(w, h);
        wastingScore = calculateWastingScore(bmi, h, w, ageMonths);
        dietaryScore = calculateDietaryScore(
          form.dietDiversity,
          waterScore,
          diarrheaScore,
        );
        finalScore = calculateFinalScore(wastingScore, dietaryScore);
        riskLevel = getRiskCategory(finalScore).level;
        const whoResult = calculateWHOZScore(h, w, ageMonths, form.gender);
        whoZScore = whoResult.zScore;
        whoStatus = whoResult.status;
        waz = whoResult.waz;
        haz = whoResult.haz;
        whz = whoResult.whz;
        baz = whoResult.baz;
        underweightStatus = whoResult.underweightStatus;
        stuntingStatus = whoResult.stuntingStatus;
        wastingStatus = whoResult.wastingStatus;
      }

      const assessment: Assessment = {
        id: crypto.randomUUID(),
        childId,
        date: now,
        height: h,
        weight: w,
        age: ageMonths,
        wastingScore,
        dietaryScore,
        finalScore,
        riskLevel,
        whoZScore,
        whoStatus,
        waz,
        haz,
        whz,
        baz,
        underweightStatus,
        stuntingStatus,
        wastingStatus,
        dietDiversity: form.dietDiversity,
        waterSource: waterScore,
        recentDiarrhea: diarrheaScore,
        cameraAnalyzed: false,
        notes: form.medicalConditions || undefined,
      };

      addAssessment(assessment);

      navigate({ to: "/results" });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── BMI preview ────────────────────────────────────────────────────────────
  const bmi =
    form.height && form.weight
      ? calculateBMI(Number(form.weight), Number(form.height))
      : 0;
  const bmiCategory = getBMICategory(bmi);

  // ── Dietary risk preview ───────────────────────────────────────────────────
  const waterScore = waterSourceToScore(form.waterSourceType);
  const diarrheaScore = form.recentDiarrhea ? 0 : 10;
  const dietaryPreview = calculateDietaryScore(
    form.dietDiversity,
    waterScore,
    diarrheaScore,
  );
  const dietaryRiskLabel =
    dietaryPreview <= 30
      ? "Low Risk"
      : dietaryPreview <= 60
        ? "Moderate Risk"
        : "High Risk";
  const dietaryRiskColor =
    dietaryPreview <= 30
      ? "text-green-400"
      : dietaryPreview <= 60
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <span>📋</span>
            <span>Child Assessment Form</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            New Health Assessment
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details to get an accurate malnutrition risk score
          </p>
        </motion.div>

        {/* Step Progress Bar */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-smooth ${
                    i < step
                      ? "gradient-teal text-white"
                      : i === step
                        ? "border-2 border-primary text-primary bg-primary/10"
                        : "border border-white/10 text-muted-foreground bg-white/5"
                  }`}
                  data-ocid={`step-indicator-${i}`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className={`mt-1 text-[10px] text-center hidden sm:block transition-smooth ${
                    i === step
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          {/* Teal progress bar */}
          <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full gradient-teal"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {STEPS[step].description}
            </span>
          </div>
        </motion.div>

        {/* Form Card */}
        <GlassCard variant="elevated" className="p-6 sm:p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* ── Step 1: Child Info ── */}
              {step === 0 && (
                <StepChildInfo form={form} errors={errors} update={update} />
              )}

              {/* ── Step 2: Body Measurements ── */}
              {step === 1 && (
                <StepBodyMeasurements
                  form={form}
                  errors={errors}
                  update={update}
                  bmi={bmi}
                  bmiCategory={bmiCategory}
                />
              )}

              {/* ── Step 3: Dietary Assessment ── */}
              {step === 2 && (
                <StepDietaryAssessment
                  form={form}
                  update={update}
                  dietaryPreview={dietaryPreview}
                  dietaryRiskLabel={dietaryRiskLabel}
                  dietaryRiskColor={dietaryRiskColor}
                />
              )}

              {/* ── Step 4: Lifestyle ── */}
              {step === 3 && (
                <StepLifestyle
                  form={form}
                  update={update}
                  ageYears={Number(form.ageYears)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/8">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground border border-white/10 bg-white/5 hover:bg-white/10 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-smooth"
              data-ocid="form-back-btn"
            >
              ← Back
            </button>

            <div className="flex items-center gap-3">
              {step === 3 && (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="text-xs text-muted-foreground border border-white/10 px-3 py-2 rounded-lg hover:bg-white/5 transition-smooth"
                  data-ocid="form-save-draft-btn"
                >
                  💾 Save Draft
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold gradient-teal text-white shadow-lg hover:opacity-90 transition-smooth glow-teal"
                  data-ocid="form-next-btn"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold gradient-health text-white shadow-lg hover:opacity-90 disabled:opacity-70 transition-smooth"
                  data-ocid="form-submit-btn"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>🔬 Get Results</>
                  )}
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Step sub-components ───────────────────────────────────────────────────────

interface StepProps {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

// Step 1 ─────────────────────────────────────────────────────────────────────
function StepChildInfo({
  form,
  errors,
  update,
}: StepProps & { errors: Partial<Record<keyof FormState, string>> }) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon="👶"
        title={STEPS[0].title}
        description={STEPS[0].description}
      />

      {/* Child Name */}
      <div>
        <label className={labelCls} htmlFor="childName">
          Child's Full Name <span className="text-red-400">*</span>
        </label>
        <input
          id="childName"
          type="text"
          placeholder="e.g. Aarav Sharma"
          value={form.childName}
          onChange={(e) => update("childName", e.target.value)}
          className={inputCls}
          data-ocid="form-child-name"
        />
        {errors.childName && <p className={errorCls}>{errors.childName}</p>}
      </div>

      {/* Age */}
      <div>
        <label className={labelCls} htmlFor="age">
          Age (years) <span className="text-red-400">*</span>
        </label>
        <input
          id="age"
          type="number"
          placeholder="e.g. 3"
          min={0}
          max={17}
          value={form.ageYears}
          onChange={(e) => update("ageYears", e.target.value)}
          className={inputCls}
          data-ocid="form-age"
        />
        {errors.ageYears && <p className={errorCls}>{errors.ageYears}</p>}
      </div>

      {/* Gender */}
      <fieldset className="border-0 p-0 m-0">
        <legend className={labelCls}>Gender</legend>
        <div className="flex gap-3">
          {(["male", "female"] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => update("gender", g)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-smooth capitalize ${
                form.gender === g
                  ? "gradient-teal text-white border-transparent"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              }`}
              data-ocid={`form-gender-${g}`}
            >
              {g === "male" ? "👦 Male" : "👧 Female"}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

// Step 2 ─────────────────────────────────────────────────────────────────────
function StepBodyMeasurements({
  form,
  errors,
  update,
  bmi,
  bmiCategory,
}: StepProps & {
  errors: Partial<Record<keyof FormState, string>>;
  bmi: number;
  bmiCategory: { label: string; color: string; bg: string };
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon="📏"
        title={STEPS[1].title}
        description={STEPS[1].description}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Height */}
        <div>
          <label className={labelCls} htmlFor="height">
            Height (cm) <span className="text-red-400">*</span>
          </label>
          <input
            id="height"
            type="number"
            placeholder="e.g. 95"
            min={30}
            max={200}
            value={form.height}
            onChange={(e) => update("height", e.target.value)}
            className={inputCls}
            data-ocid="form-height"
          />
          {errors.height && <p className={errorCls}>{errors.height}</p>}
        </div>

        {/* Weight */}
        <div>
          <label className={labelCls} htmlFor="weight">
            Weight (kg) <span className="text-red-400">*</span>
          </label>
          <input
            id="weight"
            type="number"
            placeholder="e.g. 14"
            min={2}
            max={150}
            step={0.1}
            value={form.weight}
            onChange={(e) => update("weight", e.target.value)}
            className={inputCls}
            data-ocid="form-weight"
          />
          {errors.weight && <p className={errorCls}>{errors.weight}</p>}
        </div>
      </div>

      {/* Live BMI Card */}
      <motion.div
        className={`rounded-xl border border-white/10 p-4 ${bmiCategory.bg} transition-smooth`}
        layout
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Body Mass Index (BMI)
            </p>
            <p className={`text-2xl font-bold font-mono ${bmiCategory.color}`}>
              {bmi > 0 ? bmi.toFixed(1) : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${bmiCategory.color}`}>
              {bmiCategory.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bmi > 0 ? "Calculated live" : "Enter height & weight"}
            </p>
          </div>
        </div>

        {bmi > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                bmi < 16
                  ? "bg-red-400"
                  : bmi < 25
                    ? "bg-green-400"
                    : "bg-yellow-400"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (bmi / 35) * 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Step 3 ─────────────────────────────────────────────────────────────────────
function StepDietaryAssessment({
  form,
  update,
  dietaryPreview,
  dietaryRiskLabel,
  dietaryRiskColor,
}: StepProps & {
  dietaryPreview: number;
  dietaryRiskLabel: string;
  dietaryRiskColor: string;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon="🥗"
        title={STEPS[2].title}
        description={STEPS[2].description}
      />

      {/* Diet Diversity Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`${labelCls} mb-0`} htmlFor="dietDiversity">
            Diet Diversity
          </label>
          <span className="text-sm font-semibold text-primary">
            {form.dietDiversity}/10 —{" "}
            {DIET_DIVERSITY_LABELS[form.dietDiversity]}
          </span>
        </div>
        <input
          id="dietDiversity"
          type="range"
          min={1}
          max={10}
          value={form.dietDiversity}
          onChange={(e) => update("dietDiversity", Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-teal-500 bg-white/10"
          data-ocid="form-diet-diversity"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            Very Limited
          </span>
          <span className="text-[10px] text-muted-foreground">
            Very Diverse
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Count how many food groups the child eats regularly (grains,
          vegetables, fruits, protein, dairy, etc.)
        </p>
      </div>

      {/* Water Source */}
      <fieldset className="border-0 p-0 m-0">
        <legend className={labelCls}>Primary Water Source</legend>
        <div className="grid grid-cols-2 gap-2">
          {WATER_SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("waterSourceType", opt.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-smooth ${
                form.waterSourceType === opt.value
                  ? "gradient-teal text-white border-transparent"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              }`}
              data-ocid={`form-water-${opt.value}`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Recent Diarrhea */}
      <fieldset className="border-0 p-0 m-0">
        <legend className={labelCls}>Diarrhea in the last 2 weeks?</legend>
        <div className="flex gap-3">
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => update("recentDiarrhea", val)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-smooth ${
                form.recentDiarrhea === val
                  ? val
                    ? "bg-red-500/20 border-red-500/40 text-red-400"
                    : "bg-green-500/20 border-green-500/40 text-green-400"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              }`}
              data-ocid={`form-diarrhea-${String(val)}`}
            >
              {val ? "⚠️ Yes" : "✅ No"}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Dietary Risk Preview */}
      <motion.div
        className="rounded-xl bg-white/5 border border-white/10 p-4"
        layout
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Dietary Risk Preview
            </p>
            <p className={`text-xl font-bold font-mono ${dietaryRiskColor}`}>
              {dietaryPreview.toFixed(0)} / 100
            </p>
          </div>
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full border ${
              dietaryPreview <= 30
                ? "text-green-400 bg-green-500/10 border-green-500/30"
                : dietaryPreview <= 60
                  ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                  : "text-red-400 bg-red-500/10 border-red-500/30"
            }`}
          >
            {dietaryRiskLabel}
          </span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              dietaryPreview <= 30
                ? "bg-green-400"
                : dietaryPreview <= 60
                  ? "bg-yellow-400"
                  : "bg-red-400"
            }`}
            animate={{ width: `${dietaryPreview}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// Step 4 ─────────────────────────────────────────────────────────────────────
function StepLifestyle({
  form,
  update,
  ageYears,
}: StepProps & { ageYears: number }) {
  const vaccinationOptions = [
    { value: "up_to_date" as const, label: "Up to Date", icon: "✅" },
    { value: "partial" as const, label: "Partial", icon: "⚡" },
    { value: "not_vaccinated" as const, label: "Not Vaccinated", icon: "❌" },
  ];

  return (
    <div className="space-y-6">
      <StepHeader
        icon="🏥"
        title={STEPS[3].title}
        description={STEPS[3].description}
      />

      {/* Breastfeeding (only if age < 2) */}
      {ageYears < 2 && (
        <fieldset className="border-0 p-0 m-0">
          <legend className={labelCls}>Currently Breastfeeding?</legend>
          <div className="flex gap-3">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => update("breastfed", val)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-smooth ${
                  form.breastfed === val
                    ? "gradient-teal text-white border-transparent"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                }`}
                data-ocid={`form-breastfed-${String(val)}`}
              >
                {val ? "👶 Yes" : "🍼 No"}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Vaccination Status */}
      <fieldset className="border-0 p-0 m-0">
        <legend className={labelCls}>Vaccination Status</legend>
        <div className="grid grid-cols-3 gap-2">
          {vaccinationOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("vaccinationStatus", opt.value)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium border transition-smooth ${
                form.vaccinationStatus === opt.value
                  ? "gradient-teal text-white border-transparent"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              }`}
              data-ocid={`form-vaccination-${opt.value}`}
            >
              <span className="text-base">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Medical Conditions */}
      <div>
        <label className={labelCls} htmlFor="medicalConditions">
          Medical Conditions / Notes{" "}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="medicalConditions"
          rows={3}
          placeholder="Any known medical conditions, allergies, or additional context…"
          value={form.medicalConditions}
          onChange={(e) => update("medicalConditions", e.target.value)}
          className={`${inputCls} resize-none`}
          data-ocid="form-medical-conditions"
        />
      </div>

      {/* Privacy note */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex gap-3">
        <span className="text-2xl shrink-0">🔒</span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Privacy Protected
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Data is processed through your local secured backend service and can
            retain only face-masked images when enabled.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared step header ────────────────────────────────────────────────────────
function StepHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 pb-4 border-b border-white/8 mb-2">
      <div className="w-12 h-12 rounded-2xl gradient-teal flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-display font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
