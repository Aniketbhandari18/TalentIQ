import { normalizeFieldOfStudy } from "../fieldOfStudyNormalizer";
import { RANKING_CONFIG } from "./config";
import { DegreeFieldResult, EducationEvaluationResult, EvaluateDegreeFieldParams, EvaluateEducationParams, FieldMatchType, ScoreDegreeFieldParams, ScoreEducationLevelParams } from "./types";
// import {
//   CandidateEducationInput,
//   DegreeFieldResult,
//   JobEducationRequirementInput,
// } from "./types";

// interface ScoreEducationLevelParams {
//   candidateLevel: string;
//   requiredLevel: string;
// }

// export type FieldMatchType = "EXACT" | "RELATED" | "NONE";

// interface ScoreDegreeFieldParams {
//   candidate: CandidateEducationInput;
//   requirement: JobEducationRequirementInput;
//   fieldMapping: Record<string, string[]>;
// }

// interface EvaluateDegreeFieldParams {
//   candidate: CandidateEducationInput;
//   requirement: JobEducationRequirementInput;
//   fieldMapping: Record<string, string[]>;
// }

// interface EvaluateEducationParams {
//   candidateEducations: CandidateEducationInput[];
//   candidateHighestEducationLevel: string;
//   requirement: JobEducationRequirementInput;
//   fieldMapping: Record<string, string[]>;
// }

// interface EducationEvaluationResult {
//   score: number | null;
//   levelScore: number | null;
//   degreeFieldScore: number | null;
//   bestDegreeFieldMatch: DegreeFieldResult | null;

//   meetsMinimumLevel: boolean | null;
//   acceptedDegreeMatched: boolean | null;
//   fieldOfStudyMatched: boolean | null;
//   relatedDegreeUsed: boolean;
//   matchedEducationRecordId: string | null;
// }

export function scoreEducationLevel({
  candidateLevel,
  requiredLevel,
}: ScoreEducationLevelParams): number {
  const { levelRank } = RANKING_CONFIG.education;

  const candidateRank = levelRank[candidateLevel];
  const requiredRank = levelRank[requiredLevel];

  if (candidateRank === undefined || requiredRank === undefined) {
    return 0;
  }

  if (requiredRank === 0) {
    return 100;
  }

  return Math.min(candidateRank / requiredRank, 1) * 100;
}

// import { normalizeFieldOfStudy } from "@/lib/normalizers/field-of-study";

// function normalizeField(value: string): string {
//   return normalizeFieldOfStudy(value).trim().toLowerCase();
// }

export function matchEducationField(
  candidateField: string,
  requiredFields: string[],
  fieldMapping: Record<string, string[]>,
): FieldMatchType {
  const candidate = normalizeFieldOfStudy(candidateField);

  const required = requiredFields.map(normalizeFieldOfStudy);

  if (required.includes(candidate)) {
    return "EXACT";
  }

  for (const field of required) {
    const candidateRelated =
      fieldMapping[candidate]?.some(
        (related) => normalizeFieldOfStudy(related) === field,
      ) ?? false;

    const requiredRelated =
      fieldMapping[field]?.some(
        (related) => normalizeFieldOfStudy(related) === candidate,
      ) ?? false;

    if (candidateRelated || requiredRelated) {
      return "RELATED";
    }
  }

  return "NONE";
}

// import { RANKING_CONFIG } from "../config";
// import type {
//   CandidateEducationInput,
//   AcceptedDegreeInput,
//   JobEducationRequirementInput,
//   DegreeFieldResult,
// } from "../types";
// import { matchEducationField } from "./match-education-field";

export function scoreDegreeField({
  candidate,
  requirement,
  fieldMapping,
}: ScoreDegreeFieldParams): DegreeFieldResult {
  const { credit } = RANKING_CONFIG.education;

  const acceptedDegree = requirement.acceptedDegrees.find(
    (degree) => degree.normalizedDegreeName === candidate.normalizedDegreeName,
  );

  // Explicitly accepted degree
  if (acceptedDegree) {
    if (acceptedDegree.normalizedAcceptedFieldOfStudy.length === 0) {
      return {
        educationRecordId: candidate.id,
        score: credit.acceptedDegreeFieldOk * 100,
        matchType: "ACCEPTED_DEGREE",
        matchedDegree: acceptedDegree.degreeName,
        candidateDegree: candidate.degreeName,
        candidateFieldOfStudy: candidate.fieldOfStudy,
        fieldMatch: "NOT_REQUIRED",
      };
    }

    const fieldMatch = candidate.normalizedFieldOfStudy
      ? matchEducationField(
          candidate.normalizedFieldOfStudy,
          acceptedDegree.normalizedAcceptedFieldOfStudy,
          fieldMapping,
        )
      : "NONE";

    let score = 0;

    if (fieldMatch === "EXACT") {
      score = credit.acceptedDegreeFieldOk;
    } else if (fieldMatch === "RELATED") {
      score = credit.acceptedDegreeAndRelatedField;
    } else if (acceptedDegree.isFieldOfStudyMandatory) {
      score = credit.acceptedDegreeWrongFieldMandatory;
    } else {
      score = credit.acceptedDegreeWrongFieldOptional;
    }

    return {
      educationRecordId: candidate.id,
      score: score * 100,
      matchType: "ACCEPTED_DEGREE",
      matchedDegree: acceptedDegree.degreeName,
      candidateDegree: candidate.degreeName,
      candidateFieldOfStudy: candidate.fieldOfStudy,
      fieldMatch,
    };
  }

  // Alternative degree
  if (requirement.normalizedRelatedDegreeFieldsOfStudy.length === 0) {
    return {
      educationRecordId: candidate.id,
      score: 0,
      matchType: "NO_MATCH",
      matchedDegree: null,
      candidateDegree: candidate.degreeName,
      candidateFieldOfStudy: candidate.fieldOfStudy,
      fieldMatch: "NONE",
    };
  }

  const fieldMatch = candidate.normalizedFieldOfStudy
    ? matchEducationField(
        candidate.normalizedFieldOfStudy,
        requirement.normalizedRelatedDegreeFieldsOfStudy,
        fieldMapping,
      )
    : "NONE";

  let score = 0;

  if (fieldMatch !== "NONE") {
    const alternativeCredit =
      credit.alternativeDegree[
        requirement.isMandatory ? "mandatory" : "optional"
      ][requirement.relatedDegreesAllowed ? "allowed" : "notAllowed"];

    score =
      fieldMatch === "EXACT"
        ? alternativeCredit.exact
        : alternativeCredit.related;
  }

  return {
    educationRecordId: candidate.id,
    score: score * 100,
    matchType: score > 0 ? "ALTERNATIVE_DEGREE" : "NO_MATCH",
    matchedDegree: null,
    candidateDegree: candidate.degreeName,
    candidateFieldOfStudy: candidate.fieldOfStudy,
    fieldMatch,
  };
}

export function evaluateDegreeField({
  candidate,
  requirement,
  fieldMapping,
}: EvaluateDegreeFieldParams): DegreeFieldResult {
  return scoreDegreeField({
    candidate,
    requirement,
    fieldMapping,
  });
}

export function evaluateEducation({
  candidateEducations,
  candidateHighestEducationLevel,
  requirement,
  fieldMapping,
}: EvaluateEducationParams): EducationEvaluationResult {
  const { levelPoints, degreePoints } = RANKING_CONFIG.education;

  const hasLevelRequirement = requirement.minEducationLevel !== null;
  const hasDegreeRequirement =
    requirement.acceptedDegrees.length > 0 ||
    requirement.relatedDegreeFieldsOfStudy.length > 0;

  let levelScore: number | null = null;
  let degreeFieldScore: number | null = null;
  let bestDegreeFieldMatch: DegreeFieldResult | null = null;

  if (hasLevelRequirement) {
    levelScore = scoreEducationLevel({
      candidateLevel: candidateHighestEducationLevel,
      requiredLevel: requirement.minEducationLevel!,
    });
  }

  if (hasDegreeRequirement) {
    if (candidateEducations.length === 0) {
      degreeFieldScore = 0;
    } else {
      const results = candidateEducations.map((education) =>
        scoreDegreeField({
          candidate: education,
          requirement,
          fieldMapping,
        }),
      );

      bestDegreeFieldMatch = results.reduce((best, current) =>
        current.score > best.score ? current : best,
      );

      degreeFieldScore = bestDegreeFieldMatch.score;
    }
  }

  if (levelScore === null && degreeFieldScore === null) {
    return {
      score: null,
      levelScore: null,
      degreeFieldScore: null,
      bestDegreeFieldMatch: null,
      meetsMinimumLevel: null,
      acceptedDegreeMatched: null,
      fieldOfStudyMatched: null,
      relatedDegreeUsed: false,
      matchedEducationRecordId: null,
    };
  }

  let score: number;

  if (levelScore !== null && degreeFieldScore !== null) {
    score =
      (levelScore * levelPoints + degreeFieldScore * degreePoints) /
      (levelPoints + degreePoints);
  } else if (levelScore !== null) {
    score = levelScore;
  } else {
    score = degreeFieldScore!;
  }

  const meetsMinimumLevel = levelScore === null ? null : levelScore === 100;

  const acceptedDegreeMatched =
    degreeFieldScore === null
      ? null
      : bestDegreeFieldMatch?.matchType === "ACCEPTED_DEGREE";

  const fieldOfStudyMatched =
    degreeFieldScore === null
      ? null
      : bestDegreeFieldMatch?.fieldMatch === "EXACT" ||
        bestDegreeFieldMatch?.fieldMatch === "RELATED";

  const relatedDegreeUsed =
    bestDegreeFieldMatch?.matchType === "ALTERNATIVE_DEGREE";

  const matchedEducationRecordId =
    bestDegreeFieldMatch?.educationRecordId ?? null;

  return {
    score,
    levelScore,
    degreeFieldScore,
    bestDegreeFieldMatch,
    meetsMinimumLevel,
    acceptedDegreeMatched,
    fieldOfStudyMatched,
    relatedDegreeUsed,
    matchedEducationRecordId,
  };
}

export function mapEducation(evaluation: EducationEvaluationResult) {
  return {
    score: evaluation.score,
    meetsMinimumLevel: evaluation.meetsMinimumLevel,
    acceptedDegreeMatched: evaluation.acceptedDegreeMatched,
    fieldOfStudyMatched: evaluation.fieldOfStudyMatched,
    relatedDegreeUsed: evaluation.relatedDegreeUsed,
    matchedEducationRecordId: evaluation.matchedEducationRecordId,
  };
}
