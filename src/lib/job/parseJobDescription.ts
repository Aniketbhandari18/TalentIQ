import { JOB_DESCRIPTION_PARSER_SYSTEM_PROMPT } from "@/constants";
import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod/v4";

type Job = {
  title: string;
  description: string;
};

export async function parseJobDescription(job: Job) {
  const systemPrompt = JOB_DESCRIPTION_PARSER_SYSTEM_PROMPT;
  const prompt = `JOB TITLE:
${job.title}

JOB DESCRIPTION:
${job.description}
`;

  const jobExtractionSchema = z.object({
    minExperience: z.number().int().nonnegative().nullable(),
    maxExperience: z.number().int().nonnegative().nullable(),
    location: z.string().nullable(),

    responsibilities: z.array(
      z.object({
        responsibility: z.string().describe("An individual job responsibility"),
        weight: z
          .number()
          .int()
          .min(1)
          .max(10)
          .describe(
            "Relevance of this responsibility for the job, from 1 (low importance) to 10 (highest importance)",
          ),
      }),
    ),

    skillGroups: z.array(
      z
        .object({
          category: z
            .string()
            .describe(
              "Descriptive category of the skill group, e.g., 'Programming Languages', 'Databases'",
            ),

          requirementType: z
            .enum(["ANY", "ALL", "PREFERRED"])
            .describe(
              "ANY means at least one skill in the group is required. ALL means every skill in the group is required. PREFERRED means the skills in the group are preferred but not mandatory",
            ),

          skills: z
            .array(
              z.object({
                name: z
                  .string()
                  .describe(
                    "Original skill name extracted from the job description.",
                  ),
              }),
            )
            .min(1)
            .describe("A list of skills that belong to this skill group"),
        })
        .describe(
          "A group of skills for a job, which can have multiple skill requirements",
        ),
    ),

    education: z
      .object({
        minEducationLevel: z
          .enum([
            "SECONDARY",
            "HIGHER_SECONDARY",
            "DIPLOMA",
            "ASSOCIATE",
            "UNDERGRADUATE",
            "POSTGRADUATE",
            "DOCTORATE",
            "OTHER",
          ])
          .nullable(),

        acceptedDegrees: z.array(
          z.object({
            degreeName: z.string(),
            acceptedFieldOfStudy: z.array(z.string()),
            isFieldOfStudyMandatory: z.boolean(),
          }),
        ),
        relatedDegreesAllowed: z.boolean(),
        relatedDegreeFieldsOfStudy: z
          .array(z.string())
          .describe(
            "A list of related degree fields of study that are allowed for this job in case relatedDegreesAllowed is true",
          ),
        isMandatory: z.boolean(),
      })
      .nullable(),
  });

  const { output } = await generateText({
    model: google("gemini-3.1-flash-lite"),
    output: Output.object({
      schema: jobExtractionSchema,
    }),
    system: systemPrompt,
    prompt: prompt,
  });

  console.dir(output, {
    depth: null,
    colors: true,
  });
  return output;
}
