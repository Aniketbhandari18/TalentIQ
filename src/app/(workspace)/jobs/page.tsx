import JobsView from "@/components/jobs/jobsView";
import Loader from "@/components/Loader";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function JobsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <JobsPageContent />
    </Suspense>
  );
}

async function JobsPageContent() {
  const { userId: clerkId } = await auth();

  if (!clerkId) redirect("/sign-in");

  const jobs = await prisma.job.findMany({
    where: {
      createdBy: {
        clerkId: clerkId,
      },
    },
    include: {
      skillGroups: {
        include: {
          skills: true,
        },
      },
      educationRequirement: {
        include: {
          acceptedDegrees: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <JobsView jobs={jobs} />;
}
