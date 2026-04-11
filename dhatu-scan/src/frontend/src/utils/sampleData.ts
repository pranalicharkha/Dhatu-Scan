import type {
  Assessment,
  Badge,
  ChildProfile,
  GamificationState,
} from "../types";
import {
  ALL_BADGES,
  calculateFinalScore,
  calculateWHOZScore,
  calculateWastingScore,
  getRiskCategory,
} from "./assessmentLogic";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

export const SAMPLE_CHILDREN: ChildProfile[] = [
  {
    id: "child_arjun",
    name: "Arjun",
    age: 48, // 4 years in months
    gender: "male",
    height: 99,
    weight: 14.5,
    dateOfBirth: new Date(new Date().setMonth(new Date().getMonth() - 48))
      .toISOString()
      .split("T")[0],
    guardianName: "Ramesh Kumar",
    location: "Rajasthan",
    createdAt: monthsAgo(7),
    updatedAt: monthsAgo(1),
  },
  {
    id: "child_priya",
    name: "Priya",
    age: 24, // 2 years in months
    gender: "female",
    height: 82,
    weight: 10.2,
    dateOfBirth: new Date(new Date().setMonth(new Date().getMonth() - 24))
      .toISOString()
      .split("T")[0],
    guardianName: "Sunita Devi",
    location: "Uttar Pradesh",
    createdAt: monthsAgo(7),
    updatedAt: monthsAgo(0),
  },
];

function makeAssessment(
  childId: string,
  monthOffset: number,
  height: number,
  weight: number,
  age: number,
  gender: "male" | "female",
  dietDiversity: number,
  waterSource: number,
  recentDiarrhea: number,
): Assessment {
  const bmi = weight / (height / 100) ** 2;
  const wastingScore = calculateWastingScore(bmi, height, weight, age);
  const dietaryScore =
    (0.4 * dietDiversity + 0.3 * waterSource + 0.3 * recentDiarrhea) * 10;
  const riskDietary = 100 - dietaryScore;
  const finalScore = calculateFinalScore(wastingScore, riskDietary);
  const whoResult = calculateWHOZScore(height, weight, age, gender);
  const risk = getRiskCategory(finalScore);

  return {
    id: makeId(),
    childId,
    date: monthsAgo(monthOffset),
    height,
    weight,
    age,
    wastingScore: Math.round(wastingScore),
    dietaryScore: Math.round(riskDietary),
    finalScore: Math.round(finalScore),
    riskLevel: risk.level,
    whoZScore: whoResult.zScore,
    whoStatus: whoResult.status,
    dietDiversity,
    waterSource,
    recentDiarrhea,
    cameraAnalyzed: monthOffset % 2 === 0,
    cameraConfidence:
      monthOffset % 2 === 0 ? 78 + Math.floor(Math.random() * 15) : undefined,
  };
}

// Arjun's 6-month history — improving over time (was moderate risk, now low)
export const ARJUN_ASSESSMENTS: Assessment[] = [
  makeAssessment("child_arjun", 6, 92, 12.2, 42, "male", 4, 5, 3),
  makeAssessment("child_arjun", 5, 93.5, 12.8, 43, "male", 5, 5, 4),
  makeAssessment("child_arjun", 4, 95, 13.1, 44, "male", 6, 6, 6),
  makeAssessment("child_arjun", 3, 96, 13.5, 45, "male", 7, 7, 7),
  makeAssessment("child_arjun", 2, 97.5, 13.9, 46, "male", 7, 8, 8),
  makeAssessment("child_arjun", 1, 99, 14.5, 48, "male", 8, 9, 9),
];

// Priya's 6-month history — moderate → improving
export const PRIYA_ASSESSMENTS: Assessment[] = [
  makeAssessment("child_priya", 6, 74, 8.5, 18, "female", 3, 4, 2),
  makeAssessment("child_priya", 5, 75.5, 8.8, 19, "female", 4, 4, 3),
  makeAssessment("child_priya", 4, 77, 9.1, 20, "female", 5, 5, 5),
  makeAssessment("child_priya", 3, 78.5, 9.5, 21, "female", 6, 6, 6),
  makeAssessment("child_priya", 2, 80, 9.8, 22, "female", 7, 7, 7),
  makeAssessment("child_priya", 1, 82, 10.2, 24, "female", 8, 8, 8),
];

export const SAMPLE_BADGES: Badge[] = ALL_BADGES.map((b, i) => ({
  ...b,
  unlocked: i < 5,
  unlockedAt: i < 5 ? monthsAgo(5 - i) : undefined,
}));

export const SAMPLE_GAMIFICATION: GamificationState = {
  xp: 620,
  level: 3,
  levelName: "Balanced",
  badges: SAMPLE_BADGES,
  checkups: 12,
  streak: 6,
  lastCheckupDate: monthsAgo(1),
};

export function getAllSampleAssessments(): Assessment[] {
  return [...ARJUN_ASSESSMENTS, ...PRIYA_ASSESSMENTS];
}
