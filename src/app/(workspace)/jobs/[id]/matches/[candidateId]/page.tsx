import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import prisma from "@/lib/prisma";
import EvaluationView from "@/components/matches/evaluationView";
import Loader from "@/components/Loader";

type PageProps = {
  params: Promise<{
    id: string;
    candidateId: string;
  }>;
};

export default async function EvaluationPage({ params }: PageProps) {
  return (
    <Suspense fallback={<Loader />}>
      <EvaluationPageContent params={params} />
    </Suspense>
  );
}

async function EvaluationPageContent({ params }: PageProps) {
  const { id: jobId, candidateId } = await params;

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Fetch the job owned by the logged-in recruiter.
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      createdById: user.id,
    },
    include: {
      skillGroups: {
        include: {
          skills: true,
        },
      },
      educationRequirement: {
        select: {
          isMandatory: true,
        },
      },
      JobResponsibilities: {
        select: {
          id: true,
          responsibility: true,
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Fetch the selected candidate's evaluation.
  const match = await prisma.candidateMatch.findFirst({
    where: {
      jobId: job.id,
      candidateId,
      candidate: {
        uploadedById: user.id,
      },
    },
    include: {
      candidate: {
        include: {
          experience: {
            select: {
              company: true,
              position: true,
              startDate: true,
              endDate: true,
            },
          },
          education: {
            select: {
              id: true,
              degree: true,
              fieldOfStudy: true,
              institution: true,
            },
          },
        },
      },
      skillGroups: {
        include: {
          skillResults: true,
        },
      },
      educationEvaluation: true,
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

  if (!match) {
    notFound();
  }

  // Candidate IDs ordered by their overall score for navigation.
  const rankedMatches = await prisma.candidateMatch.findMany({
    where: {
      jobId: job.id,
      candidate: {
        uploadedById: user.id,
      },
    },
    orderBy: [
      {
        overallScore: {
          sort: "desc",
          nulls: "last",
        },
      },
      {
        createdAt: "asc",
      },
    ],
    select: {
      candidateId: true,
    },
  });

  const rankedCandidateIds = rankedMatches.map((item) => item.candidateId);

  const currentIndex = rankedCandidateIds.indexOf(candidateId);

  const prevId = currentIndex > 0 ? rankedCandidateIds[currentIndex - 1] : null;

  const nextId =
    currentIndex >= 0 && currentIndex < rankedCandidateIds.length - 1
      ? rankedCandidateIds[currentIndex + 1]
      : null;

  return (
    <EvaluationView
      job={job}
      candidate={match.candidate}
      result={match}
      prevId={prevId}
      nextId={nextId}
    />
  );
}
