import { SectionCard } from "../shared/primitives";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JobStatusPill } from "../shared/status";
import { Job } from "@prisma/client";
import { formatRelative } from "@/lib/talentUtils";

type Props = {
  recentJobs: Job[];
};

export default function RecentJobs({ recentJobs }: Props) {
  return (
    <SectionCard
      className=""
      title="Recent jobs"
      description="Latest updates across your open roles."
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/jobs">
            View all <ArrowRight />
          </Link>
        </Button>
      }
      bodyClassName="p-0"
    >
      <ul className="divide-y">
        {recentJobs.map((j) => {
          const evaluatedAt = new Date(Date.now());
          return (
            <li key={j.id}>
              <Link
                href={`/jobs/${j.id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{j.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {j.location ?? "No location"} ·{" "}
                    {evaluatedAt
                      ? formatRelative(evaluatedAt)
                      : "Not evaluated yet"}
                  </p>
                </div>
                <JobStatusPill status={j.status} />
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
