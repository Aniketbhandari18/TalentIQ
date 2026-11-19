import { RANKING_CONFIG } from "./config";
import {
  EvaluateResponsibilitiesInput,
  EvaluateResponsibilitiesResult,
  ResponsibilityEvaluationInput,
  ResponsibilityEvaluationResult,
  ResponsibilityMatchLevel,
} from "./types";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export function evaluateResponsibility({
  responsibilityEmbedding,
  candidatePoints,
}: ResponsibilityEvaluationInput): ResponsibilityEvaluationResult {
  const { levels, maxEvidence } = RANKING_CONFIG.responsibilities;

  const matches = candidatePoints
    .map((point) => ({
      ...point,
      similarity: cosineSimilarity(responsibilityEmbedding, point.embedding),
    }))
    .filter((point) => point.similarity >= levels.weak)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxEvidence);

  const bestMatch = matches[0];

  if (!bestMatch) {
    return {
      score: 0,
      bestSimilarity: null,
      matchLevel: "NONE",
      matchedEvidenceCount: 0,
      evidence: [],
    };
  }

  let matchLevel: ResponsibilityMatchLevel = "WEAK";

  if (bestMatch.similarity >= levels.strong) {
    matchLevel = "STRONG";
  } else if (bestMatch.similarity >= levels.partial) {
    matchLevel = "PARTIAL";
  }

  return {
    score: Number((bestMatch.similarity * 100).toFixed(2)),
    bestSimilarity: bestMatch.similarity,
    matchLevel,
    matchedEvidenceCount: matches.length,
    evidence: matches.map((match, index) => ({
      pointEmbeddingId: match.id,
      evidenceText: match.content,
      sourceType: match.sourceType,
      sourceTitle: match.sourceTitle,
      similarityScore: match.similarity,
      isPrimary: index === 0,
    })),
  };
}

// import { evaluateResponsibility } from "./evaluate-responsibility";

export function evaluateResponsibilities({
  responsibilities,
  candidatePoints,
}: EvaluateResponsibilitiesInput): EvaluateResponsibilitiesResult {
  if (responsibilities.length === 0) {
    return {
      score: null,
      totalResponsibilities: 0,
      matchedResponsibilities: 0,
      results: [],
    };
  }

  const results = responsibilities.map((responsibility) => {
    const evaluation = evaluateResponsibility({
      responsibilityEmbedding: responsibility.embedding,
      candidatePoints,
    });

    return {
      jobResponsibilityId: responsibility.id,
      responsibilityText: responsibility.responsibility,
      weight: responsibility.weight,
      ...evaluation,
    };
  });

  const totalWeight = responsibilities.reduce(
    (sum, responsibility) => sum + responsibility.weight,
    0,
  );

  const weightedScore =
    totalWeight > 0
      ? results.reduce((sum, result) => sum + result.score * result.weight, 0) /
        totalWeight
      : 0;

  return {
    score: Number(weightedScore.toFixed(2)),
    totalResponsibilities: responsibilities.length,
    matchedResponsibilities: results.filter(
      (result) => result.matchLevel !== "NONE",
    ).length,
    results,
  };
}

export function mapResponsibilities(
  evaluation: EvaluateResponsibilitiesResult,
) {
  return evaluation.results.map((result) => ({
    jobResponsibilityId: result.jobResponsibilityId,
    responsibilityText: result.responsibilityText,
    weight: result.weight,
    score: result.score,
    bestSimilarity: result.bestSimilarity,
    matchLevel: result.matchLevel,
    matchedEvidenceCount: result.matchedEvidenceCount,

    evidence: {
      create: result.evidence.map((item) => ({
        pointEmbeddingId: item.pointEmbeddingId,
        evidenceText: item.evidenceText,
        sourceType: item.sourceType,
        sourceTitle: item.sourceTitle,
        similarityScore: item.similarityScore,
        isPrimary: item.isPrimary,
      })),
    },
  }));
}
