"use client";

import { JobForm } from "@/components/jobs/jobForm";
import { jobFormSchema } from "@/lib/zodSchemas/jobFormSchema";
import { Job } from "@prisma/client";
import { z } from "zod/v4";
import { useBreadcrumbContext } from "../app/BreadcrumbContext";
import { useEffect } from "react";

type Props = {
  job: Job;
};

export default function EditJobView({ job }: Props) {
  const { setJobTitle } = useBreadcrumbContext();

  useEffect(() => {
    setJobTitle(job.title);
  }, [job.title, setJobTitle]);

  const onSubmit = async (
    values: z.infer<typeof jobFormSchema>,
    activate: boolean,
  ) => {
    try {
      const response = await fetch("/api/job/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          activate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create job");
      }

      return {
        success: true,
        message: "Job updated",
        jobId: result.data.id,
      };
    } catch (error) {
      return {
        success: false,
        message: "Something went wrong",
      };
    }
  };

  return <JobForm job={job} onSubmit={onSubmit} />;
}
