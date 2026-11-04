import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processResume } from "@/inngest/functions/process-resume";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processResume],
});
