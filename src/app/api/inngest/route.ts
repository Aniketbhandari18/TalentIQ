import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processResume } from "@/inngest/functions/process-resume";
import { processJobDescription } from "@/inngest/functions/process-job-description";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processResume, processJobDescription],
});
