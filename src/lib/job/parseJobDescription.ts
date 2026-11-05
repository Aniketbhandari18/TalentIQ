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
    location: z.string().nullable(),

    responsibilities: z.array(z.string()),

    skills: z.array(
      z.object({
        name: z.string(),
        mustHave: z.boolean(),
      }),
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
        relatedDegreeFieldsOfStudy: z.array(z.string()),
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

  console.log(output);
  return output;
}
