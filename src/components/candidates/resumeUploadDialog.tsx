import { useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  FileText,
  Loader2,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pill, type PillTone } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/talentUtils";
import {
  MAX_FILES_PER_UPLOAD,
  type QueueItemStatus,
} from "@/lib/supabase/uploadService";
import { useResumeUploadQueue, type QueueItem } from "./useResumeUploadQueue";

const STATUS_INFO: Record<QueueItemStatus, { label: string; tone: PillTone }> =
  {
    WAITING: { label: "Waiting", tone: "neutral" },
    UPLOADING: { label: "Uploading", tone: "info" },
    UPLOADED: { label: "Uploaded", tone: "success" },
    FAILED: { label: "Failed", tone: "danger" },
  };

export function ResumeUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queue = useResumeUploadQueue();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const { counts, running, items } = queue;

  const finished =
    items.length > 0 &&
    !running &&
    counts.ready === 0 &&
    counts.uploading === 0 &&
    (counts.uploaded > 0 || counts.failed > 0);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;

    const res = queue.addFiles(Array.from(list));

    if (res.duplicates.length) {
      toast.warning(
        `${res.duplicates.length} duplicate file${res.duplicates.length > 1 ? "s" : ""} skipped`,
        {
          description:
            res.duplicates.slice(0, 3).join(", ") +
            (res.duplicates.length > 3 ? "…" : ""),
        },
      );
    }

    if (res.overLimit) {
      toast.error(
        `Upload limit is ${MAX_FILES_PER_UPLOAD} files — ${res.overLimit} not added.`,
      );
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);

    if (running) return;

    handleFiles(e.dataTransfer.files);
  };

  const startUpload = async () => {
    const n = counts.ready;

    if (n === 0) return;

    toast.info(`Uploading ${n} resume${n === 1 ? "" : "s"}…`);

    const result = await queue.start();

    if (result.uploaded > 0 && result.failed === 0) {
      toast.success("Files uploaded successfully", {
        description: `${result.uploaded} resume${result.uploaded === 1 ? " has" : "s have"} been queued for background processing.`,
      });

      queue.clear();
      onOpenChange(false);
    } else if (result.uploaded > 0) {
      toast.warning("Upload completed with some failures", {
        description: `${result.uploaded} resume${result.uploaded === 1 ? " was" : "s were"} queued for background processing. ${result.failed} failed.`,
      });
    } else {
      toast.error("Upload failed", {
        description:
          "None of the selected resumes could be registered. Check the errors below.",
      });
    }
  };

  const close = (o: boolean) => {
    if (!o) {
      if (running) {
        toast("Uploads continue in the background.");
      } else {
        queue.clear();
      }
    }

    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle>Upload resumes</DialogTitle>
          <DialogDescription>
            Add multiple PDF resumes. Each one is parsed into a candidate
            profile in the background.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!running) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !running && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (running) return;

              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 text-center transition-colors",
              items.length ? "py-6" : "py-12",
              dragging
                ? "border-primary bg-primary-soft/60"
                : "border-border bg-surface hover:border-primary/40",
              running && "cursor-not-allowed opacity-60",
            )}
          >
            <div className="grid size-10 place-items-center rounded-lg border bg-card shadow-card">
              <UploadCloud className="size-5 text-primary" />
            </div>

            <p className="mt-3 text-sm font-medium">
              {dragging
                ? "Drop to add files"
                : items.length
                  ? "Drop more PDFs or click to add"
                  : "Drag & drop PDF resumes here"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              PDF only · up to 10 MB each · max {MAX_FILES_PER_UPLOAD} files
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {counts.total} file{counts.total === 1 ? "" : "s"}
                  {counts.invalid > 0 && ` · ${counts.invalid} invalid`}
                  {counts.uploaded > 0 && ` · ${counts.uploaded} uploaded`}
                  {counts.failed > 0 && ` · ${counts.failed} failed`}
                </span>

                {!running && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => inputRef.current?.click()}
                    >
                      <Plus /> Add files
                    </Button>

                    <Button variant="ghost" size="sm" onClick={queue.clear}>
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              <ul className="divide-y rounded-xl border">
                {items.map((item) => (
                  <QueueRow
                    key={item.key}
                    item={item}
                    onRemove={() => queue.remove(item.key)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="m-0 w-full flex-row items-center justify-between gap-2 border-t bg-surface px-6 py-4 sm:justify-between">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Resumes are securely uploaded and processed in the background.
          </p>

          <div className="flex gap-2">
            {finished ? (
              <>
                <Button variant="outline" onClick={queue.clear}>
                  Upload more
                </Button>

                <Button asChild onClick={() => onOpenChange(false)}>
                  <Link href="/candidates">View candidates</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => close(false)}>
                  {running ? "Hide" : "Cancel"}
                </Button>

                <Button
                  onClick={startUpload}
                  disabled={running || counts.ready === 0}
                >
                  {running ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <UploadCloud />
                  )}

                  {running
                    ? "Uploading…"
                    : `Upload ${counts.ready || ""} ${counts.ready === 1 ? "file" : "files"}`.replace(
                        "  ",
                        " ",
                      )}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QueueRow({
  item,
  onRemove,
}: {
  item: QueueItem;
  onRemove: () => void;
}) {
  const info = STATUS_INFO[item.status];

  const busy = item.status === "UPLOADING";

  const Icon =
    item.invalidReason || item.status === "FAILED"
      ? AlertCircle
      : item.status === "UPLOADED"
        ? CheckCircle2
        : busy
          ? Loader2
          : CircleDashed;

  return (
    <li className="flex items-start gap-3 px-3 py-3 sm:px-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
        <FileText className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={item.file.name}>
          {item.file.name}
        </p>

        <p className="text-xs text-muted-foreground">
          {formatFileSize(item.file.size)}
        </p>

        {item.invalidReason && (
          <p className="mt-1 text-xs text-destructive">{item.invalidReason}</p>
        )}

        {item.error && (
          <p className="mt-1 text-xs text-destructive">{item.error}</p>
        )}

        {item.warning && item.status === "WAITING" && !item.invalidReason && (
          <p className="mt-1 text-xs text-warning-foreground">{item.warning}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {item.invalidReason ? (
          <Pill tone="danger">Invalid</Pill>
        ) : (
          <Pill tone={info.tone}>
            <Icon className={cn("size-3", busy && "animate-spin")} />
            {info.label}
          </Pill>
        )}

        {(item.status === "WAITING" || item.invalidReason) && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onRemove}
            aria-label={`Remove ${item.file.name}`}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </li>
  );
}
