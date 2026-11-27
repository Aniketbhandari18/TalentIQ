import {
  mergeExperiencePeriods,
  normalizeExperienceDates,
} from "../talentUtils";
import {
  EvaluateExperienceParams,
  ExperienceEvaluationResult,
  WorkExperienceInput,
} from "./types";

export function calculateTotalExperienceMonths(
  experiences: WorkExperienceInput[],
  evaluationDate: Date = new Date(),
): number {
  const normalizedPeriods = experiences
    .map((experience) =>
      normalizeExperienceDates(
        experience.startDate,
        experience.endDate,
        experience.isCurrent,
        evaluationDate,
      ),
    )
    .filter((period) => period !== null);

  const mergedPeriods = mergeExperiencePeriods(normalizedPeriods);

  return mergedPeriods.reduce(
    (total, period) => total + (period.endMonth - period.startMonth + 1),
    0,
  );
}

export function scoreExperience(
  candidateMonths: number,
  requiredYears: number,
): number {
  if (requiredYears <= 0) {
    return 100;
  }

  const requiredMonths = requiredYears * 12;

  return Math.min(candidateMonths / requiredMonths, 1) * 100;
}

export function evaluateExperience({
  experiences,
  requiredYears,
  evaluationDate = new Date(),
}: EvaluateExperienceParams): ExperienceEvaluationResult {
  const totalExperienceMonths = calculateTotalExperienceMonths(
    experiences,
    evaluationDate,
  );

  if (requiredYears === null) {
    return {
      score: null,
      totalExperienceMonths,
      requiredExperienceMonths: null,
    };
  }

  return {
    score: scoreExperience(totalExperienceMonths, requiredYears),
    totalExperienceMonths,
    requiredExperienceMonths: requiredYears * 12,
  };
}
