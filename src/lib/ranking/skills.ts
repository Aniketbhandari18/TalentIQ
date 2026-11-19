import { RANKING_CONFIG } from "./config";


export function scoreSkillGroup({
  requirementType,
  skillCredits,
}: ScoreSkillGroupParams): number {
  if (skillCredits.length === 0) {
    return 0;
  }

  const safeCredits = skillCredits.map((credit) =>
    Math.min(Math.max(credit, 0), 1),
  );

  if (requirementType === "ANY") {
    const { anyFirstMatchShare, anyMaxExtras } = RANKING_CONFIG.skills;

    const matchedCredits = safeCredits
      .filter((credit) => credit > 0)
      .sort((a, b) => b - a);

    if (matchedCredits.length === 0) {
      return 0;
    }

    const firstMatchScore = matchedCredits[0] * anyFirstMatchShare;

    const extraShare =
      anyMaxExtras > 0 ? (1 - anyFirstMatchShare) / anyMaxExtras : 0;

    const extraMatchScore = matchedCredits
      .slice(1, anyMaxExtras + 1)
      .reduce((total, credit) => total + credit * extraShare, 0);

    return (firstMatchScore + extraMatchScore) * 100;
  }

  const totalCredit = safeCredits.reduce((total, credit) => total + credit, 0);

  return (totalCredit / safeCredits.length) * 100;
}

// import type { SkillGroupResult } from "../types";

export function scoreSkillPools(
  groups: SkillGroupResult[],
): ScoreSkillPoolsResult {
  const requiredGroups = groups.filter(
    (group) =>
      group.requirementType === "ALL" || group.requirementType === "ANY",
  );

  const preferredGroups = groups.filter(
    (group) => group.requirementType === "PREFERRED",
  );

  function calculatePoolScore(
    poolGroups: SkillGroupResult[],
    poolWeight: number,
  ): number {
    const validGroups = poolGroups.filter((group) => group.totalSkills > 0);

    if (validGroups.length === 0) {
      return 0;
    }

    const totalWeight = validGroups.reduce(
      (total, group) =>
        total + RANKING_CONFIG.skills.groupWeight[group.requirementType],
      0,
    );

    if (totalWeight === 0) {
      return 0;
    }

    const weightedScore = validGroups.reduce(
      (total, group) =>
        total +
        group.score * RANKING_CONFIG.skills.groupWeight[group.requirementType],
      0,
    );

    const averageScore = weightedScore / totalWeight;

    return (averageScore / 100) * poolWeight;
  }

  const requiredScore = calculatePoolScore(
    requiredGroups,
    RANKING_CONFIG.skills.requiredPool,
  );

  const preferredScore = calculatePoolScore(
    preferredGroups,
    RANKING_CONFIG.skills.preferredPool,
  );

  return {
    requiredScore,
    preferredScore,
    totalScore: requiredScore + preferredScore,
  };
}

export function matchSkillRequirement(
  requirement: JobSkillRequirementInput,
  candidateEvidence: CandidateSkillEvidence[],
): SkillRequirementResult {
  const evidence = candidateEvidence.find(
    (item) =>
      item.normalizedName === requirement.normalizedName &&
      item.evidenceSource !== "NONE",
  );

  let status: SkillMatchStatus = "MISSING";
  let evidenceSource: SkillEvidenceSource = "NONE";
  let credit = 0;
  let evidenceTitle: string | null = null;
  let companyName: string | null = null;

  if (evidence) {
    evidenceSource = evidence.evidenceSource;
    evidenceTitle = evidence.evidenceTitle;
    companyName = evidence.companyName;

    if (evidenceSource === "SKILLS_SECTION") {
      status = "LISTED";
      credit = RANKING_CONFIG.skills.listedOnlyCredit;
    } else {
      status = "DEMONSTRATED";
      credit = RANKING_CONFIG.skills.demonstratedCredit;
    }
  }

  return {
    skillRequirementId: requirement.id,
    name: requirement.name,
    normalizedName: requirement.normalizedName,
    status,
    evidenceSource,
    credit,
    evidenceTitle,
    companyName,
  };
}

import type {
  CandidateSkillEvidence,
  JobSkillGroupInput,
  JobSkillRequirementInput,
  ScoreSkillGroupParams,
  ScoreSkillPoolsResult,
  SkillEvaluationResult,
  SkillEvidenceSource,
  SkillGroupResult,
  SkillMatchStatus,
  SkillRequirementResult,
} from "./types";

export function evaluateSkills(
  jobGroups: JobSkillGroupInput[],
  candidateEvidence: CandidateSkillEvidence[],
): SkillEvaluationResult {
  if (jobGroups.length === 0) {
    return {
      score: null,
      requiredScore: 0,
      preferredScore: 0,
      totalGroups: 0,
      totalRequirements: 0,
      matchedSkills: 0,
      demonstratedSkills: 0,
      listedSkills: 0,
      missingSkills: 0,
      groups: [],
    };
  }

  const groups: SkillGroupResult[] = jobGroups.map((group) => {
    // 1. Match every skill requirement
    const requirements = group.requirements.map((requirement) =>
      matchSkillRequirement(requirement, candidateEvidence),
    );

    // 2. Calculate group-level counts
    const demonstratedSkills = requirements.filter(
      (requirement) => requirement.status === "DEMONSTRATED",
    ).length;

    const listedSkills = requirements.filter(
      (requirement) => requirement.status === "LISTED",
    ).length;

    const missingSkills = requirements.filter(
      (requirement) => requirement.status === "MISSING",
    ).length;

    const matchedSkills = demonstratedSkills + listedSkills;

    // 3. Calculate the group's score
    const score = scoreSkillGroup({
      requirementType: group.requirementType,
      skillCredits: requirements.map((requirement) => requirement.credit),
    });

    return {
      skillGroupId: group.id,
      category: group.category,
      requirementType: group.requirementType,
      score,
      weight: RANKING_CONFIG.skills.groupWeight[group.requirementType],
      totalSkills: requirements.length,
      matchedSkills,
      demonstratedSkills,
      listedSkills,
      missingSkills,
      requirements,
    };
  });

  // 4. Calculate required and preferred pool scores
  const poolScores = scoreSkillPools(groups);

  // 5. Calculate overall skill statistics
  const totalRequirements = groups.reduce(
    (total, group) => total + group.totalSkills,
    0,
  );

  const matchedSkills = groups.reduce(
    (total, group) => total + group.matchedSkills,
    0,
  );

  const demonstratedSkills = groups.reduce(
    (total, group) => total + group.demonstratedSkills,
    0,
  );

  const listedSkills = groups.reduce(
    (total, group) => total + group.listedSkills,
    0,
  );

  const missingSkills = groups.reduce(
    (total, group) => total + group.missingSkills,
    0,
  );

  return {
    score: poolScores.totalScore,
    requiredScore: poolScores.requiredScore,
    preferredScore: poolScores.preferredScore,
    totalGroups: groups.length,
    totalRequirements,
    matchedSkills,
    demonstratedSkills,
    listedSkills,
    missingSkills,
    groups,
  };
}
