import EditJobView from "@/components/jobs/editJobView";
import Loader from "@/components/Loader";
import { EmptyState } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Briefcase } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Loader />}>
      <EditJobContent params={params} />
    </Suspense>
  );
}

async function EditJobContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  const job = await prisma.job.findUnique({
    where: {
      id: id,
      createdBy: {
        clerkId: clerkId,
      },
    },
  });

  if (!job) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Job not found"
        action={
          <Button variant="outline" asChild>
            <Link href="/jobs">
              <ArrowLeft /> Back to jobs
            </Link>
          </Button>
        }
      />
    );
  }

  return <EditJobView job={job} />;
}
