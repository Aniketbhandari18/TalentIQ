import { inngest } from "@/lib/inngest/client";
import { supabase } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { extractRawText } from "@/lib/resume/extractRawText";
import { parseResume } from "@/lib/resume/parseResume";
import { normalizeSkills } from "@/lib/skillNormalizer";
import { generateEmbeddings } from "@/lib/ai/embeddings";

export const processResume = inngest.createFunction(
  {
    id: "process-resume",
    retries: 3,
    concurrency: {
      limit: 5,
    },
    triggers: { event: "process/resume" },
    onFailure: async ({ event, error, step }) => {
      const { resumeId } = event.data.event.data;

      await step.run("mark-resume-status-failed", async () => {
        await prisma.resume.update({
          where: { id: resumeId },
          data: {
            status: "FAILED",
            errorMessage: error.message,
          },
        });
      });
    },
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
        data: {
          status: "PROCESSING",
          errorMessage: null,
        },
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

        const text = await extractRawText(data);

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

    // 5. Generate embeddings for all Experience and Project points
    const { experience, projects } = parsedData;

    const pointEntries = [
      ...experience.flatMap((exp) => exp.points),
      ...projects.flatMap((project) => project.points),
    ];

    const pointEmbeddings = await step.run(
      "generate-candidate-point-embeddings",
      async () => {
        return await generateEmbeddings(pointEntries);
      },
    );

    // 6. Create new Candidate using extracted information
    const createdCandidate = await step.run("create-candidate", async () => {
      const { skills, projects, experience, education, ...candidateData } =
        parsedData;

      // Normalize skills
      const normalizedSkills = normalizeSkills(skills);

      // Construct descriptions from individual points
      const formattedProjects = projects.map((project) => ({
        ...project,
        description: project.points.join("\n"),
      }));

      const formattedExperience = experience.map((exp) => ({
        ...exp,
        description: exp.points.join("\n"),
      }));

      return await prisma.candidate.create({
        data: {
          ...candidateData,
          skills: skills,
          normalizedSkills: normalizedSkills,
          uploadedById: uploadedById,
          resumeId: resumeId,
          projects: {
            create: formattedProjects,
          },
          experience: {
            create: formattedExperience,
          },
          education: {
            create: education,
          },
        },

        select: {
          id: true,

          experience: {
            select: {
              id: true,
              points: true,
            },
          },

          projects: {
            select: {
              id: true,
              points: true,
            },
          },
        },
      });
    });

    // 7. Save candidate point embeddings
    await step.run("save-candidate-point-embeddings", async () => {
      const embeddingByContent = new Map<string, number[]>();

      pointEntries.forEach((content, index) => {
        embeddingByContent.set(content, pointEmbeddings[index]);
      });

      const embeddingRecords = [
        ...createdCandidate.experience.flatMap((exp) =>
          exp.points.map((content) => ({
            content,
            embedding: embeddingByContent.get(content)!,
            candidateId: createdCandidate.id,
            experienceId: exp.id,
          })),
        ),

        ...createdCandidate.projects.flatMap((project) =>
          project.points.map((content) => ({
            content,
            embedding: embeddingByContent.get(content)!,
            candidateId: createdCandidate.id,
            projectId: project.id,
          })),
        ),
      ];

      if (embeddingRecords.length > 0) {
        await prisma.candidatePointEmbedding.createMany({
          data: embeddingRecords,
        });
      }
    });

    // 8. update resume process status
    await step.run("update-resume-status", async () => {
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          status: "COMPLETED",
          errorMessage: null,
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
