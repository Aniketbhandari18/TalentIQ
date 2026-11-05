import { ApiError } from "@/lib/apiError";
import { inngest } from "@/lib/inngest/client";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

const createJobSchema = z.object({
  title: z.string().trim().min(1, "Job title is required"),
  description: z.string().trim().min(1, "Job description is required"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate recruiter
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new ApiError("Unauthorized", 401);
    }

    // 2. Find recruiter in database
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new ApiError("Recruiter not found", 404);
    }

    // 3. Validate request body
    const body = await req.json();
    const validation = createJobSchema.safeParse(body);

    if (!validation.success) {
      throw new ApiError(validation.error.issues[0].message, 400);
    }

    const { title, description } = validation.data;

    // 4. Create job
    const job = await prisma.job.create({
      data: {
        title,
        description,
        createdById: user.id,
      },
    });

    // 5. Trigger background extraction
    try {
      await inngest.send({
        name: "job/extraction",
        data: {
          jobId: job.id,
        },
      });
    } catch (error) {
      console.error("Failed to trigger job extraction:", error);

      // Keep the job saved, but mark extraction as failed
      await prisma.job.update({
        where: { id: job.id },
        data: {
          extractionStatus: "FAILED",
          extractionError: "Failed to schedule job extraction",
        },
      });

      throw new ApiError(
        "Job created, but extraction could not be scheduled",
        503,
      );
    }

    // 6. Return response
    return NextResponse.json(
      { message: "Job created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
