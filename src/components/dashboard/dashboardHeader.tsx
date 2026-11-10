"use client";

import { Plus, Upload } from "lucide-react";
import { useUploadDialog } from "../app/uploadContext";
import { Button } from "../ui/button";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";

type Props = {
  activeJobsCount: number;
  processingResumesCount: number;
};

export default function DashboardHeader({
  activeJobsCount,
  processingResumesCount,
}: Props) {
  const { user: clerkUser } = useUser();

  const { openUpload } = useUploadDialog();

  if (!clerkUser) return null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
          Welcome back, {clerkUser.firstName || "Recruiter"}
        </h1>
        <Suspense>
          <p className="mt-1 text-sm text-muted-foreground">
            {processingResumesCount > 0
              ? `${processingResumesCount} resume${processingResumesCount === 1 ? " is" : "s are"} being processed.`
              : "All resumes are processed."}{" "}
            {activeJobsCount} active job{activeJobsCount === 1 ? "" : "s"}.
          </p>
        </Suspense>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={openUpload}>
          <Upload /> Upload resumes
        </Button>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus /> Create job
          </Link>
        </Button>
      </div>
    </div>
  );
}
