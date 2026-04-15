import { useCallback, useState } from "react";
import { useApp } from "../context/AppContext";
import type {
  Assessment,
  AssessmentFormData,
  Gender,
  WHOZScoreResult,
} from "../types";
import {
  applyWHORiskFloor,
  calculateBMI,
  calculateDietaryScore,
  calculateFinalScore,
  calculateWHOZScore,
  calculateWastingScore,
  getRiskCategory,
  waterSourceToScore,
} from "../utils/assessmentLogic";

function generateId(): string {
  return `asm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface UseAssessmentReturn {
  runAssessment: (data: AssessmentFormData) => Assessment;
  previewScore: (data: Partial<AssessmentFormData>) => {
    wastingScore: number;
    dietaryScore: number;
    finalScore: number;
    whoResult: WHOZScoreResult | null;
  } | null;
  isCalculating: boolean;
}

export function useAssessment(): UseAssessmentReturn {
  const { addAssessment } = useApp();
  const [isCalculating, setIsCalculating] = useState(false);

  const runAssessment = useCallback(
    (data: AssessmentFormData): Assessment => {
      setIsCalculating(true);

      const {
        height,
        weight,
        age,
        gender,
        dietDiversity,
        waterSourceType,
        recentDiarrhea,
        diarrheaFrequency,
      } = data;

      // Calculate scores
      const bmi = calculateBMI(weight, height);
      const wastingScore = calculateWastingScore(bmi, height, weight, age);

      // Convert inputs to 0-10 scale
      const waterSourceScore = waterSourceToScore(waterSourceType);
      const diarrheaScore = recentDiarrhea
        ? Math.max(0, 10 - (diarrheaFrequency ?? 5))
        : 10;

      const dietaryScore = calculateDietaryScore(
        dietDiversity,
        waterSourceScore,
        diarrheaScore,
      );

      const whoResult = calculateWHOZScore(
        height,
        weight,
        age,
        gender as Gender,
      );
      const finalScore = applyWHORiskFloor(
        calculateFinalScore(wastingScore, dietaryScore),
        whoResult,
      );
      const risk = getRiskCategory(finalScore);

      const assessment: Assessment = {
        id: generateId(),
        childId: data.childId,
        date: new Date().toISOString(),
        height,
        weight,
        age,
        wastingScore: Math.round(wastingScore),
        dietaryScore: Math.round(dietaryScore),
        finalScore: Math.round(finalScore),
        riskLevel: risk.level,
        whoZScore: whoResult.zScore,
        whoStatus: whoResult.status,
        waz: whoResult.waz,
        haz: whoResult.haz,
        whz: whoResult.whz,
        baz: whoResult.baz,
        underweightStatus: whoResult.underweightStatus,
        stuntingStatus: whoResult.stuntingStatus,
        wastingStatus: whoResult.wastingStatus,
        dietDiversity,
        waterSource: waterSourceScore,
        recentDiarrhea: diarrheaScore,
        cameraAnalyzed: false,
        notes: data.notes,
      };

      addAssessment(assessment);
      setIsCalculating(false);
      return assessment;
    },
    [addAssessment],
  );

  const previewScore = useCallback((data: Partial<AssessmentFormData>) => {
    if (!data.height || !data.weight || !data.age) return null;

    const bmi = calculateBMI(data.weight, data.height);
    const wastingScore = calculateWastingScore(
      bmi,
      data.height,
      data.weight,
      data.age,
    );
    const waterScore = data.waterSourceType
      ? waterSourceToScore(data.waterSourceType)
      : 5;
    const diarrheaScore =
      data.recentDiarrhea != null ? (data.recentDiarrhea ? 3 : 9) : 5;
    const dietaryScore = calculateDietaryScore(
      data.dietDiversity ?? 5,
      waterScore,
      diarrheaScore,
    );
    const finalScore = calculateFinalScore(wastingScore, dietaryScore);
    const whoResult = data.gender
      ? calculateWHOZScore(
          data.height,
          data.weight,
          data.age,
          data.gender as Gender,
        )
      : null;

    return {
      wastingScore: Math.round(wastingScore),
      dietaryScore: Math.round(dietaryScore),
      finalScore: Math.round(finalScore),
      whoResult,
    };
  }, []);

  return { runAssessment, previewScore, isCalculating };
}
