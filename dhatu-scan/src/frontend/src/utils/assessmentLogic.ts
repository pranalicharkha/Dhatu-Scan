import whoGrowthTables from "../data/whoGrowthTables.json";
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

type WHOIndexedRow = {
  ageMonths?: number;
  sizeCm?: number;
  l: number;
  m: number;
  s: number;
};

type TableBySex = {
  male: WHOIndexedRow[];
  female: WHOIndexedRow[];
};

type AgeSplitTableBySex = {
  male: {
    "0_24": WHOIndexedRow[];
    "24_60": WHOIndexedRow[];
  };
  female: {
    "0_24": WHOIndexedRow[];
    "24_60": WHOIndexedRow[];
  };
};

const WHO_TABLES = whoGrowthTables as {
  wfa: TableBySex;
  wfl: TableBySex;
  wfh: TableBySex;
  lhfa: AgeSplitTableBySex;
  bfa: AgeSplitTableBySex;
};

function normalizeGender(gender: Gender): "male" | "female" {
  return gender === "female" ? "female" : "male";
}

function interpolateRow(
  value: number,
  rows: WHOIndexedRow[],
  key: "ageMonths" | "sizeCm",
): WHOIndexedRow {
  const sorted = [...rows].sort((a, b) => (a[key] ?? 0) - (b[key] ?? 0));

  if (value <= (sorted[0][key] ?? 0)) return sorted[0];
  if (value >= (sorted[sorted.length - 1][key] ?? 0)) {
    return sorted[sorted.length - 1];
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const lower = sorted[i];
    const upper = sorted[i + 1];
    const lowerValue = lower[key] ?? 0;
    const upperValue = upper[key] ?? 0;

    if (value >= lowerValue && value <= upperValue) {
      if (upperValue === lowerValue) return lower;
      const t = (value - lowerValue) / (upperValue - lowerValue);
      return {
        [key]: value,
        l: lower.l + t * (upper.l - lower.l),
        m: lower.m + t * (upper.m - lower.m),
        s: lower.s + t * (upper.s - lower.s),
      };
    }
  }

  return sorted[sorted.length - 1];
}

function zScoreFromLms(observed: number, row: WHOIndexedRow): number {
  if (observed <= 0) return 0;
  if (row.l === 0) {
    return Math.log(observed / row.m) / row.s;
  }
  return (Math.pow(observed / row.m, row.l) - 1) / (row.l * row.s);
}

function classifyUnderweight(waz: number): WHOStatus {
  if (waz < -3) return "severe_underweight";
  if (waz < -2) return "underweight";
  return "normal";
}

function classifyStunting(haz: number): WHOStatus {
  if (haz < -3) return "severe_stunting";
  if (haz < -2) return "stunted";
  return "normal";
}

function classifyWasting(whz: number): WHOStatus {
  if (whz < -3) return "severe_wasting";
  if (whz < -2) return "wasted";
  return "normal";
}

function getPrimaryWHOStatus(
  underweightStatus: WHOStatus,
  stuntingStatus: WHOStatus,
  wastingStatus: WHOStatus,
): WHOStatus {
  const severityOrder: WHOStatus[] = [
    "severe_wasting",
    "severe_stunting",
    "severe_underweight",
    "wasted",
    "stunted",
    "underweight",
    "normal",
  ];

  return [underweightStatus, stuntingStatus, wastingStatus].sort(
    (a, b) => severityOrder.indexOf(a) - severityOrder.indexOf(b),
  )[0];
}

function getWHOStatusCopy(status: WHOStatus) {
  switch (status) {
    case "severe_wasting":
      return {
        label: "Severe Wasting",
        description:
          "Weight-for-height is below the WHO threshold for severe acute malnutrition.",
      };
    case "wasted":
      return {
        label: "Wasting",
        description:
          "Weight-for-height is below the WHO threshold for acute malnutrition.",
      };
    case "severe_stunting":
      return {
        label: "Severe Stunting",
        description:
          "Height-for-age is below the WHO threshold for severe chronic malnutrition.",
      };
    case "stunted":
      return {
        label: "Stunting",
        description:
          "Height-for-age is below the WHO threshold for chronic malnutrition.",
      };
    case "severe_underweight":
      return {
        label: "Severe Underweight",
        description:
          "Weight-for-age is below the WHO threshold for severe underweight.",
      };
    case "underweight":
      return {
        label: "Underweight",
        description:
          "Weight-for-age is below the WHO threshold for underweight.",
      };
    default:
      return {
        label: "Normal",
        description: "Anthropometric growth indicators are within WHO thresholds.",
      };
  }
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
  // Age in months; normalize BMI against expected range for age.
  const expectedBMI = age < 24 ? 17.5 : age < 60 ? 16.5 : 15.5;
  const bmiDeviation = (expectedBMI - bmi) / expectedBMI;
  // Height-for-weight ratio heuristic for overall risk fusion.
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

/** DietaryScore = 0.4*DietDiversity + 0.3*WaterSource + 0.3*RecentDiarrhea */
export function calculateDietaryScore(
  dietDiversity: number,
  waterSource: number,
  recentDiarrhea: number,
): number {
  const score =
    (0.4 * dietDiversity + 0.3 * waterSource + 0.3 * recentDiarrhea) * 10;
  const riskScore = 100 - score;
  return Math.max(0, Math.min(100, riskScore));
}

/** FinalScore = 0.7*WastingScore + 0.3*DietaryRiskScore */
export function calculateFinalScore(
  wastingScore: number,
  dietaryScore: number,
): number {
  const score = 0.7 * wastingScore + 0.3 * dietaryScore;
  return Math.max(0, Math.min(100, score));
}

export function calculateImageRiskScore(
  imageRiskScore: number,
  qualityScore: number,
  faceLandmarksDetected: number,
  bodyLandmarksDetected: number,
): number {
  const imageSignal = imageRiskScore * 0.7;
  const qualityPenalty = (100 - qualityScore) * 0.15;
  const facePenalty =
    ((468 - Math.min(faceLandmarksDetected, 468)) / 468) * 7.5;
  const bodyPenalty =
    ((33 - Math.min(bodyLandmarksDetected, 33)) / 33) * 7.5;
  return Math.max(
    0,
    Math.min(100, Math.round(imageSignal + qualityPenalty + facePenalty + bodyPenalty)),
  );
}

export function calculateIntegratedRiskScore(
  wastingScore: number,
  dietaryScore: number,
  imageRiskScore: number,
): number {
  return Math.max(
    0,
    Math.min(100, Math.round(wastingScore * 0.55 + dietaryScore * 0.2 + imageRiskScore * 0.25)),
  );
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
  const sex = normalizeGender(gender);
  const bmi = calculateBMI(weight, height);

  const wfaRef = interpolateRow(age, WHO_TABLES.wfa[sex], "ageMonths");
  const lhfaTable =
    age < 24 ? WHO_TABLES.lhfa[sex]["0_24"] : WHO_TABLES.lhfa[sex]["24_60"];
  const bmiTable =
    age < 24 ? WHO_TABLES.bfa[sex]["0_24"] : WHO_TABLES.bfa[sex]["24_60"];
  const sizeTable = age < 24 ? WHO_TABLES.wfl[sex] : WHO_TABLES.wfh[sex];

  const hazRef = interpolateRow(age, lhfaTable, "ageMonths");
  const bazRef = interpolateRow(age, bmiTable, "ageMonths");
  const whzRef = interpolateRow(height, sizeTable, "sizeCm");

  const waz = zScoreFromLms(weight, wfaRef);
  const haz = zScoreFromLms(height, hazRef);
  const whz = zScoreFromLms(weight, whzRef);
  const baz = zScoreFromLms(bmi, bazRef);

  const underweightStatus = classifyUnderweight(waz);
  const stuntingStatus = classifyStunting(haz);
  const wastingStatus = classifyWasting(whz);
  const status = getPrimaryWHOStatus(
    underweightStatus,
    stuntingStatus,
    wastingStatus,
  );
  const primaryZ = Math.min(waz, haz, whz);
  const copy = getWHOStatusCopy(status);

  return {
    zScore: Number(primaryZ.toFixed(2)),
    status,
    label: copy.label,
    description: copy.description,
    waz: Number(waz.toFixed(2)),
    haz: Number(haz.toFixed(2)),
    whz: Number(whz.toFixed(2)),
    baz: Number(baz.toFixed(2)),
    underweightStatus,
    stuntingStatus,
    wastingStatus,
  };
}

// XP earned per assessment based on risk level and consistency
export function calculateXP(assessment: Assessment): number {
  let xp = 50;
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
    severe_underweight: "#d97706",
    stunted: "#f97316",
    severe_stunting: "#ea580c",
    wasted: "#ef4444",
    severe_wasting: "#dc2626",
  };
  return map[status];
}
