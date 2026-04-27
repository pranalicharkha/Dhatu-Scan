// Core domain types for Dhatu-Scan

export type Gender = "male" | "female" | "other";
export type WHOStatus =
  | "normal"
  | "underweight"
  | "severe_underweight"
  | "stunted"
  | "severe_stunting"
  | "wasted"
  | "severe_wasting";
export type RiskLevel = "low" | "moderate" | "high";
export type WaterSourceType = "piped" | "borehole" | "surface" | "unprotected";

export interface ChildProfile {
  id: string;
  name: string;
  age: number; // months
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  dateOfBirth?: string; // ISO date string
  guardianName?: string;
  location?: string;
  gamification?: GamificationState;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface DietaryData {
  dietDiversity: number; // 0-10 score
  waterSource: number; // 0-10 score (mapped from WaterSourceType)
  recentDiarrhea: number; // 0-10 score (0=yes frequent, 10=no)
  breastfed?: boolean;
  mealsPerDay?: number;
}

export interface Assessment {
  id: string;
  childId: string;
  date: string; // ISO date string
  // Measurements
  height: number;
  weight: number;
  age: number; // months at time of assessment
  // Scores
  wastingScore: number; // 0-100
  dietaryScore: number; // 0-100
  finalScore: number; // 0-100
  riskLevel: RiskLevel;
  // WHO data
  whoZScore: number;
  whoStatus: WHOStatus;
  waz?: number;
  haz?: number;
  whz?: number;
  baz?: number;
  underweightStatus?: WHOStatus;
  stuntingStatus?: WHOStatus;
  wastingStatus?: WHOStatus;
  // Dietary inputs
  dietDiversity: number;
  waterSource: number;
  recentDiarrhea: number;
  // Camera
  cameraAnalyzed: boolean;
  cameraConfidence?: number; // 0-100
  imageRiskScore?: number; // 0-100 (from backend imageScore)
  imageQualityScore?: number; // 0-100
  imageWeight?: number;
  anthroWeight?: number;
  dietWeight?: number;
  imageModelName?: string;
  imageVisibleSigns?: string[];
  bodyLandmarksDetected?: number;
  faceLandmarksDetected?: number;
  faceMasked?: boolean;
  // Clinical indicator feature scores from image analysis (0–1 each)
  featureScores?: {
    ribs: number;
    limbs: number;
    eyes: number;
    fat_loss: number;
    edema: number;
    skin: number;
    thinness: number;
  };
  // Notes
  notes?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  category: "milestone" | "streak" | "health" | "engagement";
  unlocked: boolean;
  unlockedAt?: string; // ISO date string
  xpReward: number;
}

export interface GamificationState {
  xp: number;
  level: number;
  levelName: string;
  badges: Badge[];
  checkups: number; // total assessments completed
  streak: number; // consecutive monthly checkups
  lastCheckupDate?: string;
}

export interface LevelInfo {
  level: number;
  name: string;
  minXP: number;
  nextLevelXP: number;
  icon: string;
  color: string;
}

export interface RiskCategory {
  level: RiskLevel;
  label: string;
  color: string;
  description: string;
  recommendation: string;
}

export interface WHOZScoreResult {
  zScore: number;
  status: WHOStatus;
  label: string;
  description: string;
  waz: number;
  haz: number;
  whz: number;
  baz: number;
  underweightStatus: WHOStatus;
  stuntingStatus: WHOStatus;
  wastingStatus: WHOStatus;
}

export interface AssessmentFormData {
  childId: string;
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  dietDiversity: number;
  waterSourceType: WaterSourceType;
  recentDiarrhea: boolean;
  diarrheaFrequency?: number;
  breastfed?: boolean;
  mealsPerDay?: number;
  notes?: string;
}
