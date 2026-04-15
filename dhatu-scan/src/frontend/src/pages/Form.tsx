import GlassCard from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";
import { getCameraAnalysisSession } from "@/lib/cameraAnalysisSession";
import type { Assessment, WaterSourceType } from "@/types/index";
import { isBackendConfigured, submitAssessmentToBackend } from "@/lib/backendApi";
import {
  applyWHORiskFloor,
  calculateBMI,
  calculateDietaryScore,
  calculateFinalScore,
  calculateImageRiskScore,
  calculateIntegratedRiskScore,
  calculateWHOZScore,
  calculateWastingScore,
  getRiskCategory,
  waterSourceToScore,
} from "@/utils/assessmentLogic";
import { calculateAgeInMonths, formatAgeFromMonths } from "@/utils/childAge";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

interface FormState {
  height: string;
  weight: string;
  dietDiversity: number;
  waterSourceType: WaterSourceType;
  recentDiarrhea: boolean;
  breastfed: boolean;
  vaccinationStatus: "up_to_date" | "partial" | "not_vaccinated";
  medicalConditions: string;
}

const INITIAL_FORM: FormState = {
  height: "",
  weight: "",
  dietDiversity: 5,
  waterSourceType: "piped",
  recentDiarrhea: false,
  breastfed: false,
  vaccinationStatus: "up_to_date",
  medicalConditions: "",
};

const STEPS = [
  { title: "Body Measurements", description: "Height, weight, and BMI check" },
  { title: "Dietary Assessment", description: "Food, water, and recent illness" },
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

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-smooth focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30";
const errorCls = "mt-1 text-xs text-red-400";
const labelCls = "mb-2 block text-sm font-medium text-muted-foreground";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function getBMICategory(bmi: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (bmi === 0) {
    return { label: "-", color: "text-muted-foreground", bg: "bg-muted/20" };
  }
  if (bmi < 14) {
    return {
      label: "Severely Underweight",
      color: "text-red-400",
      bg: "bg-red-500/10",
    };
  }
  if (bmi < 16) {
    return {
      label: "Underweight",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    };
  }
  if (bmi < 25) {
    return {
      label: "Normal Range",
      color: "text-green-400",
      bg: "bg-green-500/10",
    };
  }
  return {
    label: "Above Normal",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  };
}

export default function Form() {
  const navigate = useNavigate();
  const { activeChild, updateChild, addAssessment } = useApp();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraSession = getCameraAnalysisSession();

  const ageMonths = useMemo(() => {
    if (!activeChild) return 0;
    return activeChild.dateOfBirth
      ? calculateAgeInMonths(activeChild.dateOfBirth)
      : activeChild.age;
  }, [activeChild]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateStep(currentStep: number) {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (currentStep === 0) {
      const height = Number(form.height);
      const weight = Number(form.weight);

      if (!form.height || Number.isNaN(height) || height < 30 || height > 200) {
        nextErrors.height = "Height must be between 30 and 200 cm";
      }

      if (!form.weight || Number.isNaN(weight) || weight < 2 || weight > 150) {
        nextErrors.weight = "Weight must be between 2 and 150 kg";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep((current) => current + 1);
  }

  function handleBack() {
    setDirection(-1);
    setStep((current) => current - 1);
  }

  async function handleSubmit() {
    if (!activeChild) return;
    if (!cameraSession?.ready) return;

    setIsSubmitting(true);

    try {
      const height = Number(form.height);
      const weight = Number(form.weight);
      const now = new Date().toISOString();
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
      const whoResult = calculateWHOZScore(
        height,
        weight,
        ageMonths,
        activeChild.gender,
      );

      if (isBackendConfigured()) {
        try {
          const backendResult = await submitAssessmentToBackend({
            childId: activeChild.id,
            childName: activeChild.name,
            ageMonths,
            gender: activeChild.gender,
            heightCm: height,
            weightKg: weight,
            dietDiversity: form.dietDiversity,
            waterSourceType: form.waterSourceType,
            recentDiarrhea: form.recentDiarrhea,
            diarrheaFrequency: form.recentDiarrhea ? 10 : 0,
            breastfed: form.breastfed,
            captureMode: cameraSession.mode,
            bodyLandmarksDetected: cameraSession.bodyLandmarksDetected,
            faceLandmarksDetected: cameraSession.faceLandmarksDetected,
            faceMasked: cameraSession.faceMasked,
            modelName: cameraSession.modelName,
            modelConfidence: cameraSession.modelConfidence / 100,
            embeddingRiskHint: cameraSession.imageRiskScore,
            qualityScore: cameraSession.qualityScore,
            visibleSigns: cameraSession.visibleSigns,
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
        const bmi = calculateBMI(weight, height);
        wastingScore = calculateWastingScore(bmi, height, weight, ageMonths);
        dietaryScore = calculateDietaryScore(
          form.dietDiversity,
          waterScore,
          diarrheaScore,
        );
        const imageRiskScore = calculateImageRiskScore(
          cameraSession.imageRiskScore,
          cameraSession.qualityScore,
          cameraSession.faceLandmarksDetected,
          cameraSession.bodyLandmarksDetected,
        );
        finalScore = calculateIntegratedRiskScore(
          wastingScore,
          dietaryScore,
          imageRiskScore,
        );
        finalScore = applyWHORiskFloor(finalScore, whoResult);
        riskLevel = getRiskCategory(finalScore).level;
        whoZScore = whoResult.zScore;
        whoStatus = whoResult.status;
      }

      waz = whoResult.waz;
      haz = whoResult.haz;
      whz = whoResult.whz;
      baz = whoResult.baz;
      underweightStatus = whoResult.underweightStatus;
      stuntingStatus = whoResult.stuntingStatus;
      wastingStatus = whoResult.wastingStatus;

      updateChild({
        ...activeChild,
        age: ageMonths,
        height,
        weight,
        updatedAt: now,
      });

      addAssessment({
        id: crypto.randomUUID(),
        childId: activeChild.id,
        date: now,
        height,
        weight,
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
        cameraAnalyzed: true,
        cameraConfidence: cameraSession.modelConfidence,
        imageRiskScore: cameraSession.imageRiskScore,
        imageQualityScore: cameraSession.qualityScore,
        imageModelName: cameraSession.modelName,
        imageVisibleSigns: cameraSession.visibleSigns,
        bodyLandmarksDetected: cameraSession.bodyLandmarksDetected,
        faceLandmarksDetected: cameraSession.faceLandmarksDetected,
        faceMasked: cameraSession.faceMasked,
        notes: form.medicalConditions || undefined,
      });

      await navigate({ to: "/results" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const bmi =
    form.height && form.weight
      ? calculateBMI(Number(form.weight), Number(form.height))
      : 0;
  const bmiCategory = getBMICategory(bmi);
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

  if (!activeChild) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <GlassCard variant="elevated" className="rounded-[2rem] p-8 text-center">
            <p className="text-sm uppercase tracking-[0.22em] text-primary">
              Screening
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground">
              Select a child profile before screening.
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              The parent account can hold multiple children. Choose or add a child
              from the sidebar profile section, then return here to continue.
            </p>
            <Link
              to="/children"
              className="mt-6 inline-flex rounded-full border border-primary/25 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-smooth hover:bg-primary/15"
            >
              Open Child Profiles
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!cameraSession?.ready) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <GlassCard variant="elevated" className="rounded-[2rem] p-8 text-center">
            <p className="text-sm uppercase tracking-[0.22em] text-primary">
              Camera Required
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground">
              Complete image analysis before screening.
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              The form is locked until the child image reaches complete face and
              body landmark detection and the processed image is generated.
            </p>
            <Link
              to="/camera"
              className="mt-6 inline-flex rounded-full border border-primary/25 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-smooth hover:bg-primary/15"
            >
              Return To Camera
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <span>📋</span>
            <span>Child Assessment Form</span>
          </div>
          <h1 className="mb-1 font-display text-2xl font-bold text-foreground">
            New Health Assessment
          </h1>
          <p className="text-sm text-muted-foreground">
            Screening for {activeChild.name} using the saved child profile
          </p>
        </motion.div>

        <GlassCard variant="elevated" className="mb-6 rounded-[2rem] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Active Child
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
                {activeChild.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatAgeFromMonths(ageMonths)} · {activeChild.gender}
                {activeChild.dateOfBirth ? ` · DOB ${activeChild.dateOfBirth}` : ""}
              </p>
            </div>
            <Link
              to="/children"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-foreground transition-smooth hover:bg-white/10"
            >
              Switch Child
            </Link>
          </div>
        </GlassCard>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-3 flex items-center justify-between">
            {STEPS.map((stepItem, index) => (
              <div key={stepItem.title} className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-smooth ${
                    index < step
                      ? "gradient-teal text-white"
                      : index === step
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "border border-white/10 bg-white/5 text-muted-foreground"
                  }`}
                >
                  {index < step ? "✓" : index + 1}
                </div>
                <span
                  className={`mt-1 hidden text-center text-[10px] transition-smooth sm:block ${
                    index === step ? "font-medium text-primary" : "text-muted-foreground"
                  }`}
                >
                  {stepItem.title}
                </span>
              </div>
            ))}
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full gradient-teal"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {STEPS[step].description}
            </span>
          </div>
        </motion.div>

        <GlassCard variant="elevated" className="rounded-[2rem] p-6 sm:p-8">
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
              {step === 0 && (
                <StepBodyMeasurements
                  form={form}
                  errors={errors}
                  update={update}
                  bmi={bmi}
                  bmiCategory={bmiCategory}
                />
              )}

              {step === 1 && (
                <StepDietaryAssessment
                  form={form}
                  update={update}
                  dietaryPreview={dietaryPreview}
                  dietaryRiskLabel={dietaryRiskLabel}
                  dietaryRiskColor={dietaryRiskColor}
                />
              )}

              {step === 2 && (
                <StepLifestyle
                  form={form}
                  update={update}
                  ageYears={ageMonths / 12}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 border-t border-white/8 pt-6">
            <div className="flex items-center justify-between gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground transition-smooth hover:bg-white/10"
                >
                  Back
                </button>
              ) : (
                <Link
                  to="/children"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground transition-smooth hover:bg-white/10"
                >
                  Change Child
                </Link>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-smooth hover:opacity-90 gradient-teal"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-smooth hover:opacity-90 disabled:opacity-70 gradient-health"
                >
                  {isSubmitting ? "Analyzing..." : "Get Results"}
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

interface StepProps {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

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
        title={STEPS[0].title}
        description={STEPS[0].description}
      />

      <div className="grid grid-cols-2 gap-4">
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
          />
          {errors.height && <p className={errorCls}>{errors.height}</p>}
        </div>

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
          />
          {errors.weight && <p className={errorCls}>{errors.weight}</p>}
        </div>
      </div>

      <motion.div className={`rounded-xl border border-white/10 p-4 ${bmiCategory.bg}`} layout>
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              Body Mass Index (BMI)
            </p>
            <p className={`font-mono text-2xl font-bold ${bmiCategory.color}`}>
              {bmi > 0 ? bmi.toFixed(1) : "-"}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${bmiCategory.color}`}>
              {bmiCategory.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {bmi > 0 ? "Calculated live" : "Enter height and weight"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

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
        title={STEPS[1].title}
        description={STEPS[1].description}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className={`${labelCls} mb-0`} htmlFor="dietDiversity">
            Diet Diversity
          </label>
          <span className="text-sm font-semibold text-primary">
            {form.dietDiversity}/10 - {DIET_DIVERSITY_LABELS[form.dietDiversity]}
          </span>
        </div>
        <input
          id="dietDiversity"
          type="range"
          min={1}
          max={10}
          value={form.dietDiversity}
          onChange={(e) => update("dietDiversity", Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-teal-500"
        />
        <div className="mt-1 flex justify-between">
          <span className="text-[10px] text-muted-foreground">Very Limited</span>
          <span className="text-[10px] text-muted-foreground">Very Diverse</span>
        </div>
      </div>

      <fieldset className="m-0 border-0 p-0">
        <legend className={labelCls}>Primary Water Source</legend>
        <div className="grid grid-cols-2 gap-2">
          {WATER_SOURCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update("waterSourceType", option.value)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-smooth ${
                form.waterSourceType === option.value
                  ? "gradient-teal border-transparent text-white"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="m-0 border-0 p-0">
        <legend className={labelCls}>Diarrhea in the last 2 weeks?</legend>
        <div className="flex gap-3">
          {([true, false] as const).map((value) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => update("recentDiarrhea", value)}
              className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-smooth ${
                form.recentDiarrhea === value
                  ? value
                    ? "border-red-500/40 bg-red-500/20 text-red-400"
                    : "border-green-500/40 bg-green-500/20 text-green-400"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {value ? "⚠️ Yes" : "✅ No"}
            </button>
          ))}
        </div>
      </fieldset>

      <motion.div className="rounded-xl border border-white/10 bg-white/5 p-4" layout>
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              Dietary Risk Preview
            </p>
            <p className={`font-mono text-xl font-bold ${dietaryRiskColor}`}>
              {dietaryPreview.toFixed(0)} / 100
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${
              dietaryPreview <= 30
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : dietaryPreview <= 60
                  ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {dietaryRiskLabel}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

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
        title={STEPS[2].title}
        description={STEPS[2].description}
      />

      {ageYears < 2 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className={labelCls}>Currently Breastfeeding?</legend>
          <div className="flex gap-3">
            {([true, false] as const).map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => update("breastfed", value)}
                className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-smooth ${
                  form.breastfed === value
                    ? "gradient-teal border-transparent text-white"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {value ? "👶 Yes" : "🥛 No"}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="m-0 border-0 p-0">
        <legend className={labelCls}>Vaccination Status</legend>
        <div className="grid grid-cols-3 gap-2">
          {vaccinationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update("vaccinationStatus", option.value)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-smooth ${
                form.vaccinationStatus === option.value
                  ? "gradient-teal border-transparent text-white"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              <span className="text-base">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={labelCls} htmlFor="medicalConditions">
          Medical Conditions / Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="medicalConditions"
          rows={3}
          value={form.medicalConditions}
          onChange={(e) => update("medicalConditions", e.target.value)}
          placeholder="Any known medical conditions, allergies, or extra context..."
          className={`${inputCls} resize-none`}
        />
      </div>
    </div>
  );
}

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
    <div className="mb-2 flex items-center gap-4 border-b border-white/8 pb-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl gradient-teal">
        {icon}
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
