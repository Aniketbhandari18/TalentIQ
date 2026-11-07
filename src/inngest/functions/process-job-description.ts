import { normalizeDegree } from "@/lib/degreeNormalizer";
import { normalizeFieldsOfStudy } from "@/lib/fieldOfStudyNormalizer";
import { inngest } from "@/lib/inngest/client";
import { parseJobDescription } from "@/lib/job/parseJobDescription";
import prisma from "@/lib/prisma";
import { normalizeSkill } from "@/lib/skillNormalizer";

export const processJobDescription = inngest.createFunction(
  {
    id: "process-job-description",
    triggers: { event: "job/extraction" },
  },
  async ({ event, step }) => {
    const { jobId } = event.data;

    try {
      // 1. Fetch job
      const job = await step.run("fetch-job", async () => {
        const existingJob = await prisma.job.findUnique({
          where: { id: jobId },
        });

        if (!existingJob) {
          throw new Error(`Job not found: ${jobId}`);
        }

        return existingJob;
      });

      // 2. Mark extraction as processing
      await step.run("mark-processing", async () => {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            extractionStatus: "PROCESSING",
            extractionError: null,
          },
        });
      });

      // 3. Extract job details using Gemini
      const extractedData = await step.run("extract-job-details", async () => {
        return await parseJobDescription({
          title: job.title,
          description: job.description,
        });
      });

      // 4. Normalize and save extracted information
      await step.run("save-job-details", async () => {
        const {
          minExperience,
          maxExperience,
          location,
          skillGroups,
          education,
          responsibilities,
        } = extractedData;

        let educationData = undefined;

        if (education) {
          const { acceptedDegrees, ...restEducation } = education;

          educationData = {
            ...restEducation,

            // Normalize related degree fields of study
            normalizedRelatedDegreeFieldsOfStudy: normalizeFieldsOfStudy(
              education.relatedDegreeFieldsOfStudy,
            ),

            acceptedDegrees: {
              create: acceptedDegrees.map((degree) => ({
                ...degree,
                normalizedDegreeName: normalizeDegree(degree.degreeName),

                // Normalize accepted fields of study
                normalizedAcceptedFieldOfStudy: normalizeFieldsOfStudy(
                  degree.acceptedFieldOfStudy,
                ),
              })),
            },
          };
        }

        const normalizedSkillGroups = skillGroups.map((group) => ({
          category: group.category,
          requirementType: group.requirementType,
          skills: {
            create: group.skills.map((skill) => ({
              name: skill.name,
              normalizedName: normalizeSkill(skill.name),
            })),
          },
        }));

        await prisma.job.update({
          where: { id: job.id },
          data: {
            minExperience: minExperience,
            maxExperience: maxExperience,
            location: location,
            JobResponsibilities: {
              create: responsibilities,
            },

            skillGroups: {
              create: normalizedSkillGroups,
            },

            ...(educationData && {
              educationRequirement: {
                create: educationData,
              },
            }),
          },
        });
      });

      return {
        success: true,
        jobId,
      };
    } catch (error) {
      console.error("Job extraction failed:", error);

      await step.run("mark-failed", async () => {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            extractionStatus: "FAILED",
            extractionError:
              error instanceof Error
                ? error.message
                : "Unknown extraction error",
          },
        });
      });

      throw error;
    }
  },
);
