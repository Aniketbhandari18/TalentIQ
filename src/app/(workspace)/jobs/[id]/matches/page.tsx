import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { MatchesView } from "@/components/matches/matchesView";
import { JobStatus } from "@prisma/client";
// import { MatchesView } from "./matches-view";

export const instant = false;

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) notFound();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!user) notFound();

  const job = await prisma.job.findFirst({
    where: {
      id: id,
      createdById: user.id,
    },
    select: {
      id: true,
      title: true,
      status: true,
      extractionStatus: true,
      minExperience: true,
      skillGroups: {
        select: { id: true },
      },
      educationRequirement: {
        select: { id: true },
      },
      JobResponsibilities: {
        select: { id: true },
      },
    },
  });

  if (!job) notFound();

  console.log("Requested job ID:", job.id);

  const totalMatches = await prisma.candidateMatch.count();

  const allMatches = await prisma.candidateMatch.findMany({
    select: {
      id: true,
      jobId: true,
      candidateId: true,
      overallScore: true,
    },
  });

  console.log("Total matches in DB:", totalMatches);
  console.log("All matches:", allMatches);

  const matches = await prisma.candidateMatch.findMany({
    where: { jobId: job.id },
    orderBy: [
      { overallScore: { sort: "desc", nulls: "last" } },
      { updatedAt: "desc" },
    ],
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
          skills: true,
        },
      },
      skillGroups: {
        include: {
          skillResults: {
            select: {
              id: true,
              name: true,
              normalizedName: true,
              status: true,
              evidenceSource: true,
              credit: true,
              evidenceTitle: true,
              companyName: true,
            },
          },
        },
      },
      educationEvaluation: {
        include: {
          matchedEducation: {
            select: {
              educationLevel: true,
              degree: true,
              fieldOfStudy: true,
              institution: true,
            },
          },
        },
      },
      experienceEvaluation: true,
      responsibilityMatches: {
        include: {
          evidence: {
            select: {
              id: true,
              evidenceText: true,
              sourceType: true,
              sourceTitle: true,
              similarityScore: true,
              isPrimary: true,
            },
          },
        },
      },
    },
  });

  console.log("matches:", matches);

  const hasRequirements =
    job.skillGroups.length > 0 ||
    job.educationRequirement !== null ||
    job.JobResponsibilities.length > 0 ||
    job.minExperience !== null;

  const results = matches.map((match) => ({
    id: match.id,
    overallScore: match.overallScore,
    skillScore: match.skillScore,
    educationScore: match.educationScore,
    experienceScore: match.experienceScore,
    responsibilityScore: match.responsibilityScore,
    updatedAt: match.updatedAt.toISOString(),
    candidate: match.candidate,
    skillGroups: match.skillGroups.map((group) => ({
      id: group.id,
      category: group.category,
      requirementType: group.requirementType,
      score: group.score,
      totalCount: group.totalCount,
      matchedCount: group.matchedCount,
      demonstratedCount: group.demonstratedCount,
      listedCount: group.listedCount,
      missingCount: group.missingCount,
      skillResults: group.skillResults,
    })),
    educationEvaluation: match.educationEvaluation
      ? {
          score: match.educationEvaluation.score,
          meetsMinimumLevel: match.educationEvaluation.meetsMinimumLevel,
          acceptedDegreeMatched:
            match.educationEvaluation.acceptedDegreeMatched,
          fieldOfStudyMatched: match.educationEvaluation.fieldOfStudyMatched,
          relatedDegreeUsed: match.educationEvaluation.relatedDegreeUsed,
          matchedEducation: match.educationEvaluation.matchedEducation,
        }
      : null,
    experienceEvaluation: match.experienceEvaluation
      ? {
          score: match.experienceEvaluation.score,
          totalWorkExperience: match.experienceEvaluation.totalWorkExperience,
          meetsMinimumExperience:
            match.experienceEvaluation.meetsMinimumExperience,
          meetsMaximumExperience:
            match.experienceEvaluation.meetsMaximumExperience,
        }
      : null,
    responsibilityMatches: match.responsibilityMatches.map(
      (responsibility) => ({
        id: responsibility.id,
        responsibilityText: responsibility.responsibilityText,
        weight: responsibility.weight,
        score: responsibility.score,
        bestSimilarity: responsibility.bestSimilarity,
        matchLevel: responsibility.matchLevel,
        matchedEvidenceCount: responsibility.matchedEvidenceCount,
        evidence: responsibility.evidence,
      }),
    ),
  }));

  return (
    <MatchesView
      job={{
        id: job.id,
        title: job.title,
        status: job.status as JobStatus,
        extractionStatus: job.extractionStatus,
      }}
      matches={results}
      canEvaluate={
        job.status === "ACTIVE" &&
        job.extractionStatus === "COMPLETED" &&
        hasRequirements
      }
    />
  );
}
