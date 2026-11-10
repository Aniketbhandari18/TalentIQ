"use client";

import {
  EmptyState,
  InitialsAvatar,
  SectionCard,
  SkillChips,
} from "../shared/primitives";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, Upload, Users } from "lucide-react";
import { Candidate } from "@prisma/client";
import { formatRelative } from "@/lib/talentUtils";
import { useUploadDialog } from "../app/uploadContext";
import { capitalizeName } from "@/lib/capitalize";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  recentCandidates: Candidate[];
};

export default function RecentlyAddedCandidates({ recentCandidates }: Props) {
  const { openUpload } = useUploadDialog();

  const isMobile = useIsMobile();

  const max = isMobile ? 1 : 4;

  return (
    <SectionCard
      title="Recently added candidates"
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/candidates">
            View all <ArrowRight />
          </Link>
        </Button>
      }
      bodyClassName="p-0"
    >
      {recentCandidates.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={Users}
            title="No candidates yet"
            action={
              <Button size="sm" onClick={openUpload}>
                <Upload /> Upload resumes
              </Button>
            }
            className="border-0"
          />
        </div>
      ) : (
        <ul className="divide-y">
          {recentCandidates.map((c) => (
            <li key={c.id}>
              <Link
                href={`/candidates/${c.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50"
              >
                <InitialsAvatar name={capitalizeName(c.name || "Candidate")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {capitalizeName(c.name || "Candidate")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.email || "No email provided"}
                  </p>
                </div>
                <SkillChips
                  skills={c.normalizedSkills}
                  max={max}
                  className=" justify-end flex"
                />
                <span className="shrink-0 text-xs text-muted-foreground md:block">
                  {formatRelative(c.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
