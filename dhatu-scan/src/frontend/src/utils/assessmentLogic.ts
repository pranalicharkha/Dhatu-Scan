import type {
  Assessment,
  GamificationState,
  Gender,
  LevelInfo,
  RiskCategory,
  RiskLevel,
  WHOStatus,
  WHOZScoreResult,
  WaterSourceType,
} from "../types";

// WHO Reference medians (simplified) for height-for-age and weight-for-age
// Z-score = (observed - median) / SD
const WHO_MEDIANS: Record<
  string,
  {
    wfa_m: number;
    wfa_f: number;
    hfa_m: number;
    hfa_f: number;
    sd_w: number;
    sd_h: number;
  }
> = {
  "0": {
    wfa_m: 3.3,
    wfa_f: 3.2,
    hfa_m: 49.9,
    hfa_f: 49.1,
    sd_w: 0.39,
    sd_h: 1.9,
  },
  "6": {
    wfa_m: 7.9,
    wfa_f: 7.3,
    hfa_m: 67.6,
    hfa_f: 65.7,
    sd_w: 0.78,
    sd_h: 2.4,
  },
  "12": {
    wfa_m: 9.6,
    wfa_f: 8.9,
    hfa_m: 75.7,
    hfa_f: 74.0,
    sd_w: 0.94,
    sd_h: 2.7,
  },
  "18": {
    wfa_m: 10.9,
    wfa_f: 10.2,
    hfa_m: 82.3,
    hfa_f: 80.7,
    sd_w: 1.06,
    sd_h: 2.9,
  },
  "24": {
    wfa_m: 12.2,
    wfa_f: 11.5,
    hfa_m: 87.8,
    hfa_f: 86.4,
    sd_w: 1.18,
    sd_h: 3.1,
  },
  "36": {
    wfa_m: 14.3,
    wfa_f: 13.9,
    hfa_m: 96.1,
    hfa_f: 95.1,
    sd_w: 1.4,
    sd_h: 3.5,
  },
  "48": {
    wfa_m: 16.3,
    wfa_f: 15.9,
    hfa_m: 103.3,
    hfa_f: 102.7,
    sd_w: 1.6,
    sd_h: 3.8,
  },
  "60": {
    wfa_m: 18.3,
    wfa_f: 17.7,
    hfa_m: 110.0,
    hfa_f: 109.4,
    sd_w: 1.8,
    sd_h: 4.0,
  },
};

function getWHOReference(ageMonths: number, gender: Gender) {
  const keys = Object.keys(WHO_MEDIANS)
    .map(Number)
    .sort((a, b) => a - b);
  let lower = keys[0];
  let upper = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (ageMonths >= keys[i] && ageMonths <= keys[i + 1]) {
      lower = keys[i];
      upper = keys[i + 1];
      break;
    }
  }
  const lowerRef = WHO_MEDIANS[lower.toString()];
  const upperRef = WHO_MEDIANS[upper.toString()];
  const t = upper === lower ? 0 : (ageMonths - lower) / (upper - lower);
  return {
    wfa:
      gender === "female"
        ? lowerRef.wfa_f + t * (upperRef.wfa_f - lowerRef.wfa_f)
        : lowerRef.wfa_m + t * (upperRef.wfa_m - lowerRef.wfa_m),
    hfa:
      gender === "female"
        ? lowerRef.hfa_f + t * (upperRef.hfa_f - lowerRef.hfa_f)
        : lowerRef.hfa_m + t * (upperRef.hfa_m - lowerRef.hfa_m),
    sd_w: lowerRef.sd_w + t * (upperRef.sd_w - lowerRef.sd_w),
    sd_h: lowerRef.sd_h + t * (upperRef.sd_h - lowerRef.sd_h),
  };
}

export function calculateBMI(weight: number, height: number): number {
  if (height <= 0 || weight <= 0) return 0;
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

export function calculateWastingScore(
  bmi: number,
  height: number,
  weight: number,
  age: number,
): number {
  // Age in months; normalize BMI against expected range for age
  const expectedBMI = age < 24 ? 17.5 : age < 60 ? 16.5 : 15.5;
  const bmiDeviation = (expectedBMI - bmi) / expectedBMI;
  // Height-for-weight ratio (simplified)
  const hwRatio = (weight / height) * 100;
  const expectedHWRatio = age < 12 ? 11 : age < 36 ? 13 : 15;
  const hwDeviation = (expectedHWRatio - hwRatio) / expectedHWRatio;
  const rawScore = (bmiDeviation * 0.6 + hwDeviation * 0.4) * 100;
  return Math.max(0, Math.min(100, rawScore));
}

export function waterSourceToScore(waterSource: WaterSourceType): number {
  const map: Record<WaterSourceType, number> = {
    piped: 10,
    borehole: 7,
    surface: 3,
    unprotected: 0,
  };
  return map[waterSource] ?? 5;
}

/** DietaryScore = 0.4×DietDiversity + 0.3×WaterSource + 0.3×RecentDiarrhea */
export function calculateDietaryScore(
  dietDiversity: number,
  waterSource: number,
  recentDiarrhea: number,
): number {
  // Inputs are 0-10, outputs 0-100
  const score =
    (0.4 * dietDiversity + 0.3 * waterSource + 0.3 * recentDiarrhea) * 10;
  // Invert: higher score = higher RISK
  const riskScore = 100 - score;
  return Math.max(0, Math.min(100, riskScore));
}

/** FinalScore = 0.7×WastingScore + 0.3×DietaryRiskScore */
export function calculateFinalScore(
  wastingScore: number,
  dietaryScore: number,
): number {
  const score = 0.7 * wastingScore + 0.3 * dietaryScore;
  return Math.max(0, Math.min(100, score));
}

export function getRiskCategory(score: number): RiskCategory {
  if (score <= 30) {
    return {
      level: "low",
      label: "Low Risk",
      color: "text-green-health",
      description: "Child shows healthy growth indicators",
      recommendation:
        "Continue regular monitoring. Maintain balanced diet and clean water access.",
    };
  }
  if (score <= 60) {
    return {
      level: "moderate",
      label: "Moderate Risk",
      color: "text-yellow-500",
      description: "Some risk factors detected requiring attention",
      recommendation:
        "Improve dietary diversity, consult a healthcare worker within 2 weeks.",
    };
  }
  return {
    level: "high",
    label: "High Risk",
    color: "text-red-500",
    description: "Significant malnutrition indicators detected",
    recommendation:
      "Immediate consultation with a pediatrician or nutrition specialist required.",
  };
}

export function calculateWHOZScore(
  height: number,
  weight: number,
  age: number,
  gender: Gender,
): WHOZScoreResult {
  const ref = getWHOReference(age, gender);
  // Weight-for-age Z-score
  const wazScore = (weight - ref.wfa) / (ref.sd_w * 2);
  // Height-for-age Z-score
  const hazScore = (height - ref.hfa) / (ref.sd_h * 2);
  // Weight-for-height (wasting indicator) - simplified
  const whzScore = (weight - ref.wfa * 0.85) / (ref.sd_w * 1.5);

  // Use worst Z-score as primary indicator
  const primaryZ = Math.min(wazScore, hazScore, whzScore);

  let status: WHOStatus;
  let label: string;
  let description: string;

  if (primaryZ >= -1) {
    status = "normal";
    label = "Normal";
    description = "Growth is within healthy WHO standards";
  } else if (primaryZ >= -2) {
    if (wazScore < -1) {
      status = "underweight";
      label = "Underweight";
      description = "Weight is slightly below WHO reference median";
    } else {
      status = "stunted";
      label = "Mildly Stunted";
      description = "Height is slightly below WHO reference for age";
    }
  } else if (primaryZ >= -3) {
    if (whzScore < -2) {
      status = "wasted";
      label = "Wasted";
      description = "Acute malnutrition — weight-for-height is critically low";
    } else {
      status = "stunted";
      label = "Stunted";
      description =
        "Chronic malnutrition — height significantly below WHO standard";
    }
  } else {
    status = "severe_wasting";
    label = "Severe Wasting";
    description = "Severe acute malnutrition — immediate intervention required";
  }

  return { zScore: Number(primaryZ.toFixed(2)), status, label, description };
}

// XP earned per assessment based on risk level and consistency
export function calculateXP(assessment: Assessment): number {
  let xp = 50; // base XP for completing an assessment
  if (assessment.cameraAnalyzed) xp += 20;
  if (assessment.riskLevel === "low") xp += 30;
  else if (assessment.riskLevel === "moderate") xp += 15;
  return xp;
}

export const LEVELS: LevelInfo[] = [
  {
    level: 1,
    name: "Starting Point",
    minXP: 0,
    nextLevelXP: 250,
    icon: "🧒",
    color: "#f59e0b",
  },
  {
    level: 2,
    name: "Recovering",
    minXP: 250,
    nextLevelXP: 500,
    icon: "🙂",
    color: "#14b8a6",
  },
  {
    level: 3,
    name: "Balanced",
    minXP: 500,
    nextLevelXP: 750,
    icon: "😊",
    color: "#06b6d4",
  },
  {
    level: 4,
    name: "Healthy",
    minXP: 750,
    nextLevelXP: 1000,
    icon: "😄",
    color: "#22c55e",
  },
  {
    level: 5,
    name: "Thriving",
    minXP: 1000,
    nextLevelXP: Number.POSITIVE_INFINITY,
    icon: "🤸",
    color: "#3b82f6",
  },
];

export function getLevel(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getLevelProgress(xp: number): number {
  const level = getLevel(xp);
  if (level.nextLevelXP === Number.POSITIVE_INFINITY) return 100;
  const progress =
    ((xp - level.minXP) / (level.nextLevelXP - level.minXP)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export const ALL_BADGES: Omit<
  GamificationState["badges"][number],
  "unlocked" | "unlockedAt"
>[] = [
  {
    id: "camera_ready",
    name: "Camera Ready",
    description: "Used camera analysis for an assessment",
    icon: "📷",
    category: "engagement",
    xpReward: 75,
  },
  {
    id: "healthy_child",
    name: "Healthy",
    description: "Child scored Low Risk in assessment",
    icon: "💚",
    category: "health",
    xpReward: 80,
  },
  {
    id: "three_checkups",
    name: "Consistent Care",
    description: "Completed 3 assessments",
    icon: "📋",
    category: "streak",
    xpReward: 120,
  },
  {
    id: "six_months",
    name: "Six Month Champion",
    description: "Tracked child health for 6 months",
    icon: "🏆",
    category: "milestone",
    xpReward: 200,
  },
  {
    id: "improvement",
    name: "Getting Stronger",
    description: "Risk level improved between assessments",
    icon: "📈",
    category: "health",
    xpReward: 150,
  },
];

export function getRiskLevelColor(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: "#10b981",
    moderate: "#f59e0b",
    high: "#ef4444",
  };
  return map[level];
}

export function getWHOStatusColor(status: WHOStatus): string {
  const map: Record<WHOStatus, string> = {
    normal: "#10b981",
    underweight: "#f59e0b",
    stunted: "#f97316",
    wasted: "#ef4444",
    severe_wasting: "#dc2626",
  };
  return map[status];
}
