import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processResume } from "@/inngest/functions/process-resume";
import { processJobDescription } from "@/inngest/functions/process-job-description";
import { matchCandidates } from "@/inngest/functions/match-candidates";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processResume, processJobDescription, matchCandidates],
});
