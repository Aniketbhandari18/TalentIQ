"use client";

import { JobForm } from "@/components/jobs/jobForm";
import { jobFormSchema } from "@/lib/zodSchemas/jobFormSchema";
import { z } from "zod/v4";

export default function NewJobView() {
  const onSubmit = async (
    values: z.infer<typeof jobFormSchema>,
    activate: boolean,
  ) => {
    try {
      const response = await fetch("/api/job/create", {
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
        message: activate ? "Job activated" : "Draft saved",
        jobId: result.data.id,
      };
    } catch (error) {
      return {
        success: false,
        message: "Something went wrong",
      };
    }
  };

  return <JobForm onSubmit={onSubmit} />;
}
