import { Briefcase, Loader2, Sparkles, Users } from "lucide-react";

import { StatCard } from "@/components/shared/primitives";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import CandidatesAddedChart from "./candidatesAddedChart";
import TopSkills from "./topSkills";
import DashboardHeader from "./dashboardHeader";
import RecentlyAddedCandidates from "./recentlyAddedCandidates";
import RecentActivity from "./recentActivity";
import RecentJobs from "./recentJobs";

export default async function DashboardView() {
  const { userId: clerkId } = await auth();

  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) return null;

  let [recentCandidates, totalCandidates] = await Promise.all([
    prisma.candidate.findMany({
      where: {
        resume: {
          uploadedBy: {
            clerkId: clerkId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    prisma.candidate.count({
      where: {
        resume: {
          uploadedBy: {
            clerkId: clerkId,
          },
        },
      },
    }),
  ]);

  let [recentJobs, totalJobs, activeJobs] = await Promise.all([
    prisma.job.findMany({
      where: { createdById: user.id },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    prisma.job.count({
      where: { createdById: user.id },
    }),

    prisma.job.count({
      where: {
        createdById: user.id,
        status: "ACTIVE",
      },
    }),
  ]);

  const processingResumes = await prisma.resume.count({
    where: {
      uploadedById: user.id,
      status: "PROCESSING",
    },
  });

  const shortlistedCandidates = 12;

  return (
    <div className="space-y-6">
      <DashboardHeader
        activeJobsCount={activeJobs}
        processingResumesCount={processingResumes}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total candidates"
          value={totalCandidates}
          icon={Users}
          hint="In your talent pool"
        />
        <StatCard
          label="Active jobs"
          value={activeJobs}
          icon={Briefcase}
          hint={`${totalJobs} total`}
        />
        <StatCard
          label="Resumes processing"
          value={processingResumes}
          icon={Loader2}
        />
        <StatCard
          label="Candidates shortlisted"
          value={shortlistedCandidates}
          icon={Sparkles}
          hint="Across all jobs"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CandidatesAddedChart />
        <TopSkills />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <RecentJobs recentJobs={recentJobs} />
        <RecentActivity />
      </div>

      <RecentlyAddedCandidates recentCandidates={recentCandidates} />
    </div>
  );
}
