import {
  Briefcase,
  FileText,
  History,
  Sparkles,
  UserRound,
} from "lucide-react";
import { EmptyState, SectionCard } from "../shared/primitives";
import { formatRelative } from "@/lib/talentUtils";

type ActivityType = "resume" | "candidate" | "job" | "evaluation";

const ACTIVITY_ICON: Record<ActivityType, typeof FileText> = {
  resume: FileText,
  candidate: UserRound,
  job: Briefcase,
  evaluation: Sparkles,
};

type Activity = {
  id: string;
  type: ActivityType;
  message: string;
  at: Date;
};

export default function RecentActivity() {
  let recentActivities: Activity[] = [
    {
      id: "act_1",
      type: "resume",
      message: "2 resumes uploaded and queued for processing",
      at: new Date("2026-11-06T09:44:00.000Z"),
    },
    {
      id: "act_2",
      type: "candidate",
      message: "Priya Sharma added to the candidate pool",
      at: new Date("2026-11-05T14:21:00.000Z"),
    },
    {
      id: "act_3",
      type: "job",
      message: "Machine Learning Engineer - NLP saved as draft",
      at: new Date("2026-11-05T17:31:00.000Z"),
    },
    {
      id: "act_4",
      type: "evaluation",
      message: "12 candidates evaluated for Senior Frontend Engineer",
      at: new Date("2026-11-05T12:30:00.000Z"),
    },
    {
      id: "act_5",
      type: "candidate",
      message: "Arjun Mehta added to the candidate pool",
      at: new Date("2026-11-04T10:06:00.000Z"),
    },
    {
      id: "act_6",
      type: "job",
      message: "Product Designer saved as draft",
      at: new Date("2026-11-03T15:00:00.000Z"),
    },
  ];

  return (
    <SectionCard
      title="Recent activity"
      className="flex h-full flex-col"
      bodyClassName="flex-1 p-0"
    >
      {recentActivities.length === 0 ? (
        <div className="flex h-full items-center justify-center p-5">
          <EmptyState
            icon={History}
            title="No recent activity"
            className="border-0"
          />
        </div>
      ) : (
        <ul className="divide-y">
          {recentActivities.slice(0, 5).map((a) => {
            const Icon = ACTIVITY_ICON[a.type];
            return (
              <li key={a.id} className="flex gap-3 px-5 py-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-muted">
                  <Icon className="size-3.5 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{a.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(a.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
