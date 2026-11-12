import { z } from "zod/v4";

export const jobFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120),
  description: z
    .string()
    .trim()
    .min(60, "Description must be at least 60 characters")
    .max(8000),
});
