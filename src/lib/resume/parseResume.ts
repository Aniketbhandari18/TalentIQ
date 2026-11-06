import { RESUME_PARSER_SYSTEM_PROMPT } from "@/constants";
import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod/v4";

export async function parseResume(resumeText: string) {
  const systemPrompt = RESUME_PARSER_SYSTEM_PROMPT;

  const ResumeDataSchema = z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable(),
    linkedIn: z.string().nullable(),
    skills: z.array(z.string()),
    experience: z.array(
      z.object({
        company: z.string(),
        position: z.string(),
        description: z.string().nullable(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
      }),
    ),
    projects: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        technologies: z.array(z.string()),
        projectUrl: z.string().nullable(),
      }),
    ),
    education: z.array(
      z.object({
        educationLevel: z.enum([
          "SECONDARY",
          "HIGHER_SECONDARY",
          "UNDERGRADUATE",
          "POSTGRADUATE",
          "DOCTORATE",
          "OTHER",
        ]),
        institution: z.string().nullable(),
        degree: z.string().nullable(),
        fieldOfStudy: z.string().nullable(),
        startYear: z.string().nullable(),
        endYear: z.string().nullable(),
        gradeType: z.enum(["PERCENTAGE", "CGPA"]).nullable(),
        grade: z.number().nullable(),
      }),
    ),
  });

  const { output } = await generateText({
    model: google("gemini-3.1-flash-lite"),
    output: Output.object({
      schema: ResumeDataSchema,
    }),
    system: systemPrompt,
    prompt: resumeText,
  });

  console.dir(output, {
    depth: null,
    colors: true,
  });
  return output;
}
