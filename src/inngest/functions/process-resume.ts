import { inngest } from "@/lib/inngest/client";
import { supabase } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { extractRawText } from "@/lib/resume/extractRawText";
import { parseResume } from "@/lib/resume/parseResume";
import { normalizeSkills } from "@/lib/skillNormalizer";

export const processResume = inngest.createFunction(
  {
    id: "process-resume",
    retries: 3,
    concurrency: {
      limit: 5,
    },
    triggers: { event: "process/resume" },
  },
  async ({ event, step }) => {
    const { resumeId, uploadedById } = event.data;

    // 1. Fetch resume from database
    const resume = await step.run("fetch-resume", async () => {
      return prisma.resume.findUnique({
        where: { id: resumeId },
      });
    });

    if (!resume) {
      throw new Error("Resume not found");
    }

    // 2. Mark resume as processing
    await step.run("mark-processing", async () => {
      await prisma.resume.update({
        where: { id: resumeId },
        data: { status: "PROCESSING" },
      });
    });

    // 3. Download PDF and extract text
    const extractedRawText = await step.run(
      "download-and-extract",
      async () => {
        const { data, error } = await supabase.storage
          .from("Resumes")
          .download(resume.fileUrl);

        if (error || !data) {
          throw new Error("Failed to download PDF");
        }

        const buffer = Buffer.from(await data.arrayBuffer());

        const text = await extractRawText(buffer);

        if (!text) {
          throw new Error("No text could be extracted from resume");
        }

        return text;
      },
    );

    // 4. Analyze resume using Gemini
    const parsedData = await step.run("analyze-resume", async () => {
      return await parseResume(extractedRawText);
    });

    // 5. Create new Candidate using extracted information
    await step.run("create-candidate", async () => {
      const { skills, projects, experience, education, ...candidateData } =
        parsedData;

      // Normalize skills
      const normalizedSkills = normalizeSkills(skills);

      await prisma.candidate.create({
        data: {
          ...candidateData,
          skills: skills,
          normalizedSkills: normalizedSkills,
          uploadedById: uploadedById,
          resumeId: resumeId,
          projects: {
            create: projects,
          },
          experience: {
            create: experience,
          },
          education: {
            create: education,
          },
        },
      });
    });

    // update resume process status
    await step.run("update-resume-status", async () => {
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          status: "COMPLETED",
        },
      });
    });

    return {
      success: true,
      resumeId,
      status: "COMPLETED",
    };
  },
);
