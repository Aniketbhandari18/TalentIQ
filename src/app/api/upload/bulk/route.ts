import { ApiError } from "@/lib/apiError";
import { inngest } from "@/lib/inngest/client";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

const bulkUploadSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().min(1),
        path: z.string().min(1),
        size: z.number(),
      }),
    )
    .min(1)
    .max(500),
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
    const validation = bulkUploadSchema.safeParse(body);

    if (!validation.success) {
      throw new ApiError("Invalid request", 400);
    }

    const { files } = validation.data;

    // 4. Create database records
    const resumes = await prisma.resume.createManyAndReturn({
      data: files.map((file) => ({
        fileName: file.name,
        fileUrl: file.path,
        fileSize: file.size,
        status: "PENDING",
        uploadedById: user.id,
      })),
    });

    // 5. Trigger background job to process resumes
    await inngest.send(
      resumes.map((resume) => ({
        name: "process/resume",
        data: {
          resumeId: resume.id,
          uploadedById: user.id,
        },
      })),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume processing error:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { message: "Resume processing failed" },
      { status: 500 },
    );
  }
}
