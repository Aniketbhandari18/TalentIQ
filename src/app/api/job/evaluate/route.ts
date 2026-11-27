import { ApiError } from "@/lib/apiError";
import { inngest } from "@/lib/inngest/client";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

const evaluateJobSchema = z.object({
  jobId: z.string().min(1),
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
    const validation = evaluateJobSchema.safeParse(body);

    if (!validation.success) {
      throw new ApiError("Invalid request", 400);
    }

    const { jobId } = validation.data;

    // 4. Fetch job belonging to recruiter
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
        createdBy: {
          clerkId,
        },
      },
    });

    if (!job) {
      throw new ApiError("Job not found", 404);
    }

    // 5. Fetch candidate and candidate match counts
    const [candidatesCount, candidateMatchCount] = await Promise.all([
      prisma.candidate.count({
        where: {
          uploadedBy: {
            clerkId,
          },
        },
      }),

      prisma.candidateMatch.count({
        where: {
          jobId: job.id,
        },
      }),
    ]);

    // 6. Check whether evaluation is allowed
    const isExtractionInProgress =
      job.extractionStatus === "PENDING" ||
      job.extractionStatus === "PROCESSING";

    const hasUnevaluatedCandidates = candidatesCount > candidateMatchCount;

    const canEvaluate = !isExtractionInProgress && hasUnevaluatedCandidates;

    if (!canEvaluate) {
      if (isExtractionInProgress) {
        throw new ApiError(
          "Evaluation is currently being processed. Please wait until processing is complete before re-running.",
          409,
        );
      }

      throw new ApiError(
        "All available candidates have already been evaluated. There are no new candidates to evaluate.",
        409,
      );
    }

    // 7. Trigger background job to evaluate candidates
    await inngest.send({
      name: "job/match",
      data: {
        jobId: job.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Job evaluation started successfully.",
    });
  } catch (error) {
    console.error("Job evaluation error:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { message: "Job evaluation failed" },
      { status: 500 },
    );
  }
}
