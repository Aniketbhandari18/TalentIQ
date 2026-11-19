import { RANKING_CONFIG } from "./config";
import { evaluateEducation } from "./education";
import { evaluateExperience } from "./experience";
import { evaluateResponsibilities } from "./responsibility";
import { evaluateSkills } from "./skills";
import type {
  CandidateDimensionScores,
  CandidateEducationInput,
  CandidateRankingResult,
  CandidateSkillEvidence,
  EvaluateCandidateMatchInput,
  EvaluateResponsibilitiesInput,
  JobEducationRequirementInput,
  JobSkillGroupInput,
  WorkExperienceInput,
} from "./types";

export function evaluateCandidate(
  scores: CandidateDimensionScores,
): CandidateRankingResult {
  const weights = RANKING_CONFIG.weights;

  const dimensions = [
    {
      score: scores.responsibilityScore,
      weight: weights.responsibilities,
    },
    {
      score: scores.skillScore,
      weight: weights.skills,
    },
    {
      score: scores.educationScore,
      weight:
        scores.educationScore === null
          ? 0
          : scores.educationIsMandatory === false
            ? weights.education * RANKING_CONFIG.optionalEducationWeightFactor
            : weights.education,
    },
    {
      score: scores.experienceScore,
      weight: weights.experience,
    },
  ];

  const applicableDimensions = dimensions.filter(
    (dimension) => dimension.score !== null,
  );

  const totalWeight = applicableDimensions.reduce(
    (sum, dimension) => sum + dimension.weight,
    0,
  );

  const overallScore =
    totalWeight > 0
      ? applicableDimensions.reduce(
          (sum, dimension) => sum + dimension.score! * dimension.weight,
          0,
        ) / totalWeight
      : null;

  return {
    overallScore:
      overallScore === null ? null : Number(overallScore.toFixed(2)),
    responsibilityScore: scores.responsibilityScore,
    skillScore: scores.skillScore,
    educationScore: scores.educationScore,
    experienceScore: scores.experienceScore,
  };
}

export function evaluateCandidateMatch(input: EvaluateCandidateMatchInput) {
  const responsibilityEvaluation = evaluateResponsibilities(
    input.responsibilityInput,
  );

  const skillEvaluation = evaluateSkills(
    input.jobSkillGroups,
    input.candidateSkillEvidence,
  );

  const educationEvaluation = input.educationRequirement
    ? evaluateEducation({
        candidateEducations: input.candidateEducations,
        candidateHighestEducationLevel: input.candidateHighestEducationLevel,
        requirement: input.educationRequirement,
        fieldMapping: input.fieldMapping,
      })
    : null;

  const experienceEvaluation = evaluateExperience({
    experiences: input.experiences,
    requiredYears: input.requiredExperienceYears,
  });

  const ranking = evaluateCandidate({
    responsibilityScore: responsibilityEvaluation.score,
    skillScore: skillEvaluation.score,
    educationScore: educationEvaluation?.score ?? null,
    experienceScore: experienceEvaluation.score,
    educationIsMandatory: input.educationRequirement?.isMandatory ?? null,
  });

  return {
    ...ranking,
    responsibilityEvaluation,
    skillEvaluation,
    educationEvaluation,
    experienceEvaluation,
  };
}
