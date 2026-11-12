"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Rocket, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionCard } from "@/components/shared/primitives";
import { z } from "zod/v4";
import { Job } from "@prisma/client";
import { jobFormSchema } from "@/lib/zodSchemas/jobFormSchema";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  job?: Job;
  onSubmit: (
    values: z.infer<typeof jobFormSchema>,
    activate: boolean,
  ) => Promise<{ success: boolean; message: string; jobId?: string }>;
};

export function JobForm({ job, onSubmit }: Props) {
  const router = useRouter();

  const editing = !!job;
  const form = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: job?.title || "",
      description: job?.description || "",
    },
    mode: "onTouched",
  });

  const [saving, setSaving] = useState<"DRAFT" | "ACTIVE" | null>(null);

  const handleSave = (activate: boolean) => {
    form.handleSubmit(
      async (values) => {
        try {
          setSaving(activate ? "ACTIVE" : "DRAFT");

          const result = await onSubmit(values, activate);

          if (result.success) {
            toast.success(result.message);
            form.reset({
              title: "",
              description: "",
            });
            router.push(`/jobs/${result.jobId}`);
          } else {
            toast.error(result.message);
          }
        } catch {
          toast.error("Something went wrong. Please try again.");
        } finally {
          setSaving(null);
        }
      },
      () => {
        toast.error("Please fix the highlighted fields.");
      },
    )();
  };

  const errors = form.formState.errors;
  const descLen = form.watch("description").length;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="relative flex flex-col space-y-6 h-full"
      >
        <Button
          variant="ghost"
          size="sm"
          className="w-fit self-start -ml-2 text-muted-foreground"
          asChild
        >
          {editing ? (
            <Link href={`/jobs/${job.id}`}>
              <ArrowLeft /> Back to job
            </Link>
          ) : (
            <Link href="/jobs">
              <ArrowLeft /> Jobs
            </Link>
          )}
        </Button>
        <PageHeader
          title={editing ? `Edit ${job!.title}` : "Create a job"}
          description="Paste a job description, then review before saving."
        />

        <SectionCard
          title="Job information"
          description="These details are used to define the role."
        >
          <div className="space-y-4">
            <Field
              label="Job title"
              error={errors.title?.message}
              htmlFor="title"
            >
              <Input
                id="title"
                placeholder="e.g. Senior Frontend Engineer"
                {...form.register("title")}
              />
            </Field>

            <Field
              label="Job description"
              htmlFor="description"
              error={errors.description?.message}
              hint={
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{descLen} chars</span>
                </span>
              }
            >
              <Textarea
                id="description"
                rows={10}
                placeholder="Paste the full job description…"
                className="font-normal min-h-80 leading-relaxed"
                {...form.register("description")}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Sticky action bar */}
        <div className="sticky mt-auto bottom-0 left-0 right-0 z-20 border-t bg-background/90 backdrop-blur-md -mx-4 sm:-mx-6 -mb-6 lg:-mb-8">
          <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3.5 sm:px-6 lg:px-8">
            <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
              {!editing
                ? "Save as draft or activate your job when you're ready."
                : job.status === "ACTIVE"
                  ? "Save your changes when you're ready."
                  : "Save your changes as a draft or activate your job."}
            </p>

            {editing && job?.status === "ACTIVE" ? (
              <Button
                type="button"
                onClick={() => handleSave(true)}
                disabled={!!saving}
                variant="default"
              >
                {saving === "ACTIVE" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save />
                )}
                Save changes
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={!!saving}
                >
                  {saving === "DRAFT" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Save />
                  )}
                  {editing ? "Save changes" : "Save as draft"}
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={!!saving}
                >
                  {saving === "ACTIVE" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Rocket />
                  )}
                  Activate job
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string | undefined;
  error?: string | undefined;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
