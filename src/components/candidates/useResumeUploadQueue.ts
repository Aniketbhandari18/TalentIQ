import { useCallback, useRef, useState } from "react";
import {
  MAX_FILES_PER_BATCH,
  MAX_FILES_PER_UPLOAD,
  fileKey,
  validateResumeFile,
  uploadResumeBatch,
  registerUploadedResumes,
  type QueueItemStatus,
  type UploadedFile,
} from "@/lib/supabase/uploadService";

export interface QueueItem {
  key: string;
  file: File;
  status: QueueItemStatus;
  invalidReason: string | null;
  error: string | null;
  warning: string | null;
}

export interface AddFilesResult {
  added: number;
  duplicates: string[];
  overLimit: number;
}

export interface UploadResult {
  uploaded: number;
  failed: number;
}

const CONCURRENCY = MAX_FILES_PER_BATCH;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function useResumeUploadQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);

  const itemsRef = useRef<QueueItem[]>([]);
  const runningRef = useRef(false);

  const updateItems = useCallback(
    (updater: (previous: QueueItem[]) => QueueItem[]) => {
      setItems((previous) => {
        const next = updater(previous);
        itemsRef.current = next;
        return next;
      });
    },
    [],
  );

  const patch = useCallback(
    (key: string, changes: Partial<QueueItem>) => {
      updateItems((previous) =>
        previous.map((item) =>
          item.key === key ? { ...item, ...changes } : item,
        ),
      );
    },
    [updateItems],
  );

  const addFiles = useCallback(
    (files: File[]): AddFilesResult => {
      const existing = new Set(itemsRef.current.map((item) => item.key));

      const duplicates: string[] = [];
      const next: QueueItem[] = [];
      let overLimit = 0;

      for (const file of files) {
        const key = fileKey(file);

        if (existing.has(key)) {
          duplicates.push(file.name);
          continue;
        }

        if (itemsRef.current.length + next.length >= MAX_FILES_PER_UPLOAD) {
          overLimit++;
          continue;
        }

        existing.add(key);

        next.push({
          key,
          file,
          status: "WAITING",
          invalidReason: validateResumeFile(file),
          error: null,
          warning: null,
        });
      }

      updateItems((previous) => [...previous, ...next]);

      return {
        added: next.length,
        duplicates,
        overLimit,
      };
    },
    [updateItems],
  );

  const remove = useCallback(
    (key: string) => {
      updateItems((previous) => previous.filter((item) => item.key !== key));
    },
    [updateItems],
  );

  const clear = useCallback(() => {
    if (runningRef.current) return;
    updateItems(() => []);
  }, [updateItems]);

  const runQueue = useCallback(
    async (targets: QueueItem[]): Promise<UploadResult> => {
      if (targets.length === 0 || runningRef.current) {
        return { uploaded: 0, failed: 0 };
      }

      runningRef.current = true;
      setRunning(true);

      let uploadedCount = 0;
      let failedCount = 0;

      try {
        const uploadedFiles: UploadedFile[] = [];

        // Upload files to Supabase in batches.
        for (let index = 0; index < targets.length; index += CONCURRENCY) {
          const batch = targets.slice(index, index + CONCURRENCY);

          for (const item of batch) {
            patch(item.key, {
              status: "UPLOADING",
              error: null,
            });
          }

          const result = await uploadResumeBatch(
            batch.map((item) => item.file),
          );

          for (const file of result.uploadedFiles) {
            uploadedFiles.push(file);
          }

          for (const failure of result.failedFiles) {
            const item = batch.find((current) => current.file === failure.file);

            if (item) {
              failedCount++;

              patch(item.key, {
                status: "FAILED",
                error: failure.error,
              });
            }
          }
        }

        // Register successfully uploaded files in the database.
        if (uploadedFiles.length > 0) {
          try {
            await registerUploadedResumes(uploadedFiles);

            uploadedCount = uploadedFiles.length;

            for (const file of uploadedFiles) {
              const item = targets.find(
                (current) =>
                  current.file.name === file.name &&
                  current.file.size === file.size,
              );

              if (item) {
                patch(item.key, {
                  status: "UPLOADED",
                  error: null,
                });
              }
            }
          } catch (error) {
            failedCount += uploadedFiles.length;

            for (const file of uploadedFiles) {
              const item = targets.find(
                (current) =>
                  current.file.name === file.name &&
                  current.file.size === file.size,
              );

              if (item) {
                patch(item.key, {
                  status: "FAILED",
                  error: `File uploaded to storage, but registration failed: ${getErrorMessage(error)}`,
                });
              }
            }
          }
        }

        return {
          uploaded: uploadedCount,
          failed: failedCount,
        };
      } finally {
        runningRef.current = false;
        setRunning(false);
      }
    },
    [patch],
  );

  const start = useCallback((): Promise<UploadResult> => {
    const targets = itemsRef.current.filter(
      (item) => item.status === "WAITING" && !item.invalidReason,
    );

    return runQueue(targets);
  }, [runQueue]);

  const counts = {
    total: items.length,
    ready: items.filter(
      (item) => item.status === "WAITING" && !item.invalidReason,
    ).length,
    invalid: items.filter((item) => item.invalidReason).length,
    uploaded: items.filter((item) => item.status === "UPLOADED").length,
    failed: items.filter((item) => item.status === "FAILED").length,
    uploading: items.filter((item) => item.status === "UPLOADING").length,
  };

  return {
    items,
    running,
    counts,
    addFiles,
    remove,
    clear,
    start,
  };
}
