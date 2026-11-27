import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import MatchesView from "@/components/matches/matchesView";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import Loader from "@/components/Loader";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Loader />}>
      <MatchesPageContent params={params} />
    </Suspense>
  );
}

async function MatchesPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) notFound();

  const job = await prisma.job.findUnique({
    where: {
      id: id,
      createdBy: {
        clerkId: clerkId,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      extractionStatus: true,
      skillGroups: {
        select: {
          id: true,
        },
      },
      lastEvaluatedAt: true,
    },
  });

  if (!job) {
    notFound();
  }

  const matches = await prisma.candidateMatch.findMany({
    where: {
      jobId: id,
    },
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
    },
    orderBy: [
      {
        overallScore: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const formattedMatches = matches.map((match) => ({
    id: match.id,
    candidateId: match.candidateId,
    overallScore: match.overallScore,
    skillScore: match.skillScore,
    experienceScore: match.experienceScore,
    responsibilityScore: match.responsibilityScore,
    educationScore: match.educationScore,
    createdAt: match.createdAt.toISOString(),
    candidate: {
      id: match.candidate.id,
      name: match.candidate.name,
      email: match.candidate.email,
      location: match.candidate.location,
      skills: match.candidate.skills,
    },
  }));

  const [candidatesCount, candidateMatchCount] = await Promise.all([
    prisma.candidate.count({
      where: {
        uploadedBy: {
          clerkId,
        },
      },
    }),

    prisma.candidateMatch.count({
      where: {
        jobId: job.id,
      },
    }),
  ]);

  return (
    <MatchesView
      job={{
        id: job.id,
        title: job.title,
        status: job.status,
        extractionStatus: job.extractionStatus,
        skillGroupCount: job.skillGroups.length,
        lastEvaluatedAt: job.lastEvaluatedAt,
      }}
      matches={formattedMatches}
      candidatesCount={candidatesCount}
      candidateMatchCount={candidateMatchCount}
    />
  );
}
