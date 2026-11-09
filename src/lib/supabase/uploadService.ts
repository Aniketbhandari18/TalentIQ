import { supabase } from "@/lib/supabase/client";

export const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_BATCH = 10;
export const MAX_FILES_PER_UPLOAD = 500;

export type QueueItemStatus = "WAITING" | "UPLOADING" | "UPLOADED" | "FAILED";

export interface UploadedFile {
  name: string;
  path: string;
  size: number;
}

export interface SignedUrl {
  token: string;
  path: string;
}

export interface UploadFailure {
  file: File;
  error: string;
}

export interface UploadBatchResult {
  uploadedFiles: UploadedFile[];
  failedFiles: UploadFailure[];
}

export function validateResumeFile(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) return "Only PDF files are supported.";

  if (file.size === 0) return "File is empty.";

  if (file.size > MAX_RESUME_SIZE) {
    return "File exceeds the 10 MB limit.";
  }

  return null;
}

export function fileKey(file: File): string {
  return `${file.name.toLowerCase()}::${file.size}`;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();

    return (
      body.message || body.error || "Something went wrong. Please try again."
    );
  } catch {
    return "Something went wrong. Please try again.";
  }
}

/**
 * Requests signed upload URLs for a batch of files.
 */
async function requestSignedUrls(files: File[]): Promise<SignedUrl[]> {
  const response = await fetch("/api/storage/signed-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileNames: files.map((file) => file.name),
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result = await response.json();

  if (!Array.isArray(result.tokens)) {
    throw new Error("Invalid signed URL response.");
  }

  return result.tokens;
}

/**
 * Uploads one file directly to Supabase using its signed URL.
 */
async function uploadToSupabase(
  file: File,
  signedUrl: SignedUrl,
): Promise<UploadedFile> {
  const { data, error } = await supabase.storage
    .from("Resumes")
    .uploadToSignedUrl(signedUrl.path, signedUrl.token, file, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    name: file.name,
    path: data.path,
    size: file.size,
  };
}

/**
 * Uploads one batch of files.
 * Individual file failures do not fail the entire batch.
 */
export async function uploadResumeBatch(
  files: File[],
): Promise<UploadBatchResult> {
  const uploadedFiles: UploadedFile[] = [];
  const failedFiles: UploadFailure[] = [];

  let tokens: SignedUrl[];

  try {
    tokens = await requestSignedUrls(files);
  } catch (error) {
    return {
      uploadedFiles,
      failedFiles: files.map((file) => ({
        file,
        error:
          error instanceof Error
            ? error.message
            : "Could not generate signed URLs.",
      })),
    };
  }

  const results = await Promise.all(
    files.map(async (file, index) => {
      try {
        const signedUrl = tokens[index];

        if (!signedUrl?.token || !signedUrl?.path) {
          throw new Error("Signed URL was not generated for this file.");
        }

        const uploadedFile = await uploadToSupabase(file, signedUrl);

        return {
          success: true as const,
          uploadedFile,
        };
      } catch (error) {
        return {
          success: false as const,
          failure: {
            file,
            error: error instanceof Error ? error.message : "Upload failed.",
          },
        };
      }
    }),
  );

  for (const result of results) {
    if (result.success) {
      uploadedFiles.push(result.uploadedFile);
    } else {
      failedFiles.push(result.failure);
    }
  }

  return {
    uploadedFiles,
    failedFiles,
  };
}

/**
 * Registers successfully uploaded files in the database.
 * The backend triggers Inngest processing.
 */
export async function registerUploadedResumes(
  files: UploadedFile[],
): Promise<void> {
  if (files.length === 0) return;

  const response = await fetch("/api/upload/bulk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error("Resume registration failed.");
  }
}
