"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  EmptyState,
  InitialsAvatar,
  PageHeader,
  StatCard,
} from "@/components/shared/primitives";

import { JobStatusPill, ScoreBar, ScoreRing } from "@/components/shared/status";
import { JobStatus } from "@prisma/client";

// import { rerunMatching } from "./actions";

type SortKey =
  | "overallScore"
  | "skillScore"
  | "experienceScore"
  | "responsibilityScore"
  | "educationScore";

type MatchRow = {
  id: string;
  overallScore: number | null;
  skillScore: number | null;
  educationScore: number | null;
  experienceScore: number | null;
  responsibilityScore: number | null;
  updatedAt: string;

  candidate: {
    id: string;
    name: string | null;
    email: string | null;
    location: string | null;
    skills: string[];
  };

  skillGroups: {
    id: string;
    category: string;
    requirementType: string;
    score: number;
    totalCount: number;
    matchedCount: number;
    demonstratedCount: number;
    listedCount: number;
    missingCount: number;
    skillResults: {
      id: string;
      name: string;
      normalizedName: string;
      status: string;
      evidenceSource: string;
      credit: number;
      evidenceTitle: string | null;
      companyName: string | null;
    }[];
  }[];

  educationEvaluation: {
    score: number;
    meetsMinimumLevel: boolean | null;
    acceptedDegreeMatched: boolean | null;
    fieldOfStudyMatched: boolean | null;
    relatedDegreeUsed: boolean;
    matchedEducation: {
      educationLevel: string;
      degree: string | null;
      fieldOfStudy: string | null;
      institution: string | null;
    } | null;
  } | null;

  experienceEvaluation: {
    score: number;
    totalWorkExperience: number;
    meetsMinimumExperience: boolean | null;
    meetsMaximumExperience: boolean | null;
  } | null;

  responsibilityMatches: {
    id: string;
    responsibilityText: string;
    weight: number;
    score: number;
    bestSimilarity: number | null;
    matchLevel: string;
    matchedEvidenceCount: number;
    evidence: {
      id: string;
      evidenceText: string;
      sourceType: string;
      sourceTitle: string | null;
      similarityScore: number;
      isPrimary: boolean;
    }[];
  }[];
};

type JobData = {
  id: string;
  title: string;
  status: JobStatus;
  extractionStatus: string;
};

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "overallScore", label: "Overall score" },
  { value: "skillScore", label: "Skills" },
  { value: "experienceScore", label: "Experience" },
  { value: "responsibilityScore", label: "Responsibilities" },
  { value: "educationScore", label: "Education" },
];

function getTier(score: number | null) {
  if (score === null) return "unscored";
  if (score >= 75) return "strong";
  if (score >= 55) return "potential";
  return "low";
}

function formatScore(score: number | null) {
  return score === null ? "N/A" : `${score.toFixed(1)}%`;
}

export function MatchesView({
  job,
  matches,
  canEvaluate,
}: {
  job: JobData;
  matches: MatchRow[];
  canEvaluate: boolean;
}) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("overallScore");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [running, startTransition] = useTransition();

  const ranked = useMemo(() => {
    return [...matches].sort(
      (a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1),
    );
  }, [matches]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ranked
      .map((match, index) => ({
        match,
        rank: index + 1,
      }))
      .filter(({ match }) => {
        if (!q) return true;

        const candidate = match.candidate;

        return [
          candidate.name,
          candidate.email,
          candidate.location,
          ...candidate.skills,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const scoreDifference = (b.match[sort] ?? -1) - (a.match[sort] ?? -1);

        return scoreDifference || a.rank - b.rank;
      });
  }, [ranked, query, sort]);

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const strong = matches.filter(
    (match) => getTier(match.overallScore) === "strong",
  ).length;

  const potential = matches.filter(
    (match) => getTier(match.overallScore) === "potential",
  ).length;

  const averageScore =
    matches.filter((match) => match.overallScore !== null).length > 0
      ? matches.reduce((total, match) => total + (match.overallScore ?? 0), 0) /
        matches.filter((match) => match.overallScore !== null).length
      : null;

  // const run = () => {
  //   startTransition(async () => {
  //     try {
  //       await rerunMatching(job.id);
  //       toast.success("Matching run queued", {
  //         description:
  //           "Candidates will be evaluated in the background. Refresh the page to see updated results.",
  //       });
  //     } catch (error) {
  //       toast.error(
  //         error instanceof Error
  //           ? error.message
  //           : "Unable to start matching",
  //       );
  //     }
  //   });
  // };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        asChild
      >
        <Link href={`/jobs/${job.id}`}>
          <ArrowLeft className="mr-2 size-4" />
          {job.title}
        </Link>
      </Button>

      <PageHeader
        eyebrow={<JobStatusPill status={job.status} />}
        title={`Matching results · ${job.title}`}
        description={
          matches.length > 0
            ? `${matches.length} candidates evaluated. Latest result: ${new Date(
                Math.max(
                  ...matches.map((match) =>
                    new Date(match.updatedAt).getTime(),
                  ),
                ),
              ).toLocaleString()}`
            : "This job hasn't been evaluated yet."
        }
        actions={
          matches.length > 0 && (
            <Button
              variant="outline"
              // onClick={run}
              disabled={running || !canEvaluate}
            >
              {running ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Re-run matching
            </Button>
          )
        }
      />

      <div className="flex items-start gap-2.5 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Scores represent how closely a candidate's resume aligns with this
          job's requirements. They are not hiring probabilities or hiring
          decisions. Missing information in a resume does not necessarily mean
          the candidate lacks that skill or experience.
        </p>
      </div>

      {!canEvaluate && matches.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Job is not ready for matching"
          description="Make sure the job is active, its extraction is complete, and it has at least one requirement."
          action={
            <Button variant="outline" asChild>
              <Link href={`/jobs/${job.id}`}>View job</Link>
            </Button>
          }
        />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Evaluate your candidate pool"
          description="Run matching to compare your candidates against this job's requirements."
          action={
            <Button disabled={running}>
              {running ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Run matching
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Candidates evaluated"
              value={matches.length}
              icon={Users}
            />
            <StatCard
              label="Strong matches"
              value={strong}
              icon={Target}
              hint="Overall score 75+"
            />
            <StatCard
              label="Potential matches"
              value={potential}
              icon={TrendingUp}
              hint="Overall score 55–74"
            />
            <StatCard
              label="Average score"
              value={formatScore(averageScore)}
              icon={Sparkles}
            />
          </div>

          <div
            className={
              running
                ? "pointer-events-none rounded-xl border bg-card opacity-60"
                : "rounded-xl border bg-card"
            }
          >
            <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:p-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search candidates or skills"
                  className="h-9 pl-9"
                />
              </div>

              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortKey);
                  setPage(1);
                }}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by: {option.label}
                  </option>
                ))}
              </select>
            </div>

            {rows.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Search}
                  title="No candidates found"
                  description="Try another candidate name, email, or skill."
                  className="border-0"
                />
              </div>
            ) : (
              <>
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16 pl-4">Rank</TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Overall</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Responsibilities</TableHead>
                        <TableHead>Education</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {pageRows.map(({ match, rank }) => {
                        const isOpen = openId === match.id;

                        return (
                          <>
                            <TableRow
                              key={match.id}
                              className="cursor-pointer"
                              onClick={() =>
                                setOpenId(isOpen ? null : match.id)
                              }
                            >
                              <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                                #{rank}
                              </TableCell>

                              <TableCell className="max-w-[15rem]">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <InitialsAvatar
                                    name={match.candidate.name ?? "Candidate"}
                                  />

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                      {match.candidate.name ??
                                        "Unnamed candidate"}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {match.candidate.email ?? "No email"}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <ScoreRing
                                  value={match.overallScore}
                                  size={40}
                                  stroke={3.5}
                                />
                              </TableCell>

                              <TableCell>
                                <ScoreBar value={match.skillScore} />
                              </TableCell>

                              <TableCell>
                                <ScoreBar value={match.experienceScore} />
                              </TableCell>

                              <TableCell>
                                <ScoreBar value={match.responsibilityScore} />
                              </TableCell>

                              <TableCell>
                                <ScoreBar value={match.educationScore} />
                              </TableCell>

                              <TableCell>
                                {isOpen ? (
                                  <ChevronUp className="size-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="size-4 text-muted-foreground" />
                                )}
                              </TableCell>
                            </TableRow>

                            {isOpen && (
                              <TableRow key={`${match.id}-details`}>
                                <TableCell
                                  colSpan={8}
                                  className="bg-muted/20 p-5"
                                >
                                  <MatchDetails match={match} />
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <ul className="divide-y lg:hidden">
                  {pageRows.map(({ match, rank }) => (
                    <li key={match.id} className="p-4">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() =>
                          setOpenId(openId === match.id ? null : match.id)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 font-mono text-xs text-muted-foreground">
                            #{rank}
                          </span>

                          <ScoreRing value={match.overallScore} size={42} />

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {match.candidate.name ?? "Unnamed candidate"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {match.candidate.email ?? "No email"}
                            </p>
                          </div>

                          {openId === match.id ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </div>
                      </button>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                        {(
                          [
                            ["Skills", match.skillScore],
                            ["Experience", match.experienceScore],
                            ["Responsibilities", match.responsibilityScore],
                            ["Education", match.educationScore],
                          ] as const
                        ).map(([label, value]) => (
                          <div key={label}>
                            <p className="mb-1 text-muted-foreground">
                              {label}
                            </p>
                            <ScoreBar value={value} />
                          </div>
                        ))}
                      </div>

                      {openId === match.id && (
                        <div className="mt-4 border-t pt-4">
                          <MatchDetails match={match} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}{" "}
                    candidates
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage((current) => current - 1)}
                    >
                      Previous
                    </Button>

                    <span className="text-xs text-muted-foreground">
                      Page {page} of {Math.ceil(rows.length / PAGE_SIZE)}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page * PAGE_SIZE >= rows.length}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MatchDetails({ match }: { match: MatchRow }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Candidate information</h3>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p>{match.candidate.location ?? "Not provided"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p>{match.candidate.email ?? "Not provided"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Overall score</p>
            <p className="font-semibold">{formatScore(match.overallScore)}</p>
          </div>
        </div>
      </div>

      {match.skillGroups.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Skill evaluation</h3>

          <div className="space-y-4">
            {match.skillGroups.map((group) => (
              <div key={group.id} className="rounded-lg border p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{group.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.requirementType} · {group.matchedCount}/
                      {group.totalCount} matched
                    </p>
                  </div>

                  <p className="text-sm font-semibold">
                    {formatScore(group.score)}
                  </p>
                </div>

                <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{group.demonstratedCount} demonstrated</span>
                  <span>{group.listedCount} listed</span>
                  <span>{group.missingCount} missing</span>
                </div>

                <div className="space-y-2">
                  {group.skillResults.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <div>
                        <span>{skill.name}</span>
                        {skill.evidenceTitle && (
                          <p className="text-xs text-muted-foreground">
                            {skill.evidenceTitle}
                            {skill.companyName ? ` · ${skill.companyName}` : ""}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {skill.evidenceSource.replaceAll("_", " ")}
                        </span>
                        <span
                          className={
                            skill.status === "DEMONSTRATED"
                              ? "text-xs font-medium text-green-600"
                              : skill.status === "LISTED"
                                ? "text-xs font-medium text-amber-600"
                                : "text-xs font-medium text-muted-foreground"
                          }
                        >
                          {skill.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {match.experienceEvaluation && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Experience evaluation</h3>

          <div className="rounded-lg border p-3">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="text-sm">
                Total work experience:{" "}
                <strong>
                  {match.experienceEvaluation.totalWorkExperience.toFixed(1)}{" "}
                  years
                </strong>
              </p>

              <p className="text-sm font-semibold">
                {formatScore(match.experienceEvaluation.score)}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {match.experienceEvaluation.meetsMinimumExperience !== null && (
                <span>
                  Minimum experience:{" "}
                  {match.experienceEvaluation.meetsMinimumExperience
                    ? "Met"
                    : "Not met"}
                </span>
              )}

              {match.experienceEvaluation.meetsMaximumExperience !== null && (
                <span>
                  Maximum experience:{" "}
                  {match.experienceEvaluation.meetsMaximumExperience
                    ? "Within limit"
                    : "Above limit"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {match.educationEvaluation && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Education evaluation</h3>

          <div className="rounded-lg border p-3">
            <div className="mb-3 flex justify-between gap-2">
              <p className="text-sm font-medium">
                {match.educationEvaluation.matchedEducation?.degree ??
                  "Education record not specified"}
              </p>

              <p className="text-sm font-semibold">
                {formatScore(match.educationEvaluation.score)}
              </p>
            </div>

            {match.educationEvaluation.matchedEducation && (
              <div className="mb-3 text-xs text-muted-foreground">
                <p>
                  {match.educationEvaluation.matchedEducation.fieldOfStudy ??
                    "Field of study not provided"}
                </p>
                <p>
                  {match.educationEvaluation.matchedEducation.institution ??
                    "Institution not provided"}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {match.educationEvaluation.meetsMinimumLevel !== null && (
                <span>
                  Minimum level:{" "}
                  {match.educationEvaluation.meetsMinimumLevel
                    ? "Met"
                    : "Not met"}
                </span>
              )}

              {match.educationEvaluation.acceptedDegreeMatched !== null && (
                <span>
                  Accepted degree:{" "}
                  {match.educationEvaluation.acceptedDegreeMatched
                    ? "Matched"
                    : "Not matched"}
                </span>
              )}

              {match.educationEvaluation.fieldOfStudyMatched !== null && (
                <span>
                  Field of study:{" "}
                  {match.educationEvaluation.fieldOfStudyMatched
                    ? "Matched"
                    : "Not matched"}
                </span>
              )}

              {match.educationEvaluation.relatedDegreeUsed && (
                <span>Related degree considered</span>
              )}
            </div>
          </div>
        </div>
      )}

      {match.responsibilityMatches.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">
            Responsibility evaluation
          </h3>

          <div className="space-y-3">
            {match.responsibilityMatches.map((responsibility) => (
              <div key={responsibility.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-sm font-medium">
                    {responsibility.responsibilityText}
                  </p>

                  <p className="shrink-0 text-sm font-semibold">
                    {formatScore(responsibility.score)}
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Weight: {responsibility.weight}</span>
                  <span>Match: {responsibility.matchLevel}</span>
                  <span>
                    {responsibility.matchedEvidenceCount} evidence points
                  </span>
                </div>

                {responsibility.evidence.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {responsibility.evidence.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="rounded-md bg-muted/50 p-3 text-xs"
                      >
                        <div className="mb-1 flex flex-wrap justify-between gap-2">
                          <span className="font-medium">
                            {evidence.sourceTitle ?? evidence.sourceType}
                            {evidence.isPrimary ? " · Best evidence" : ""}
                          </span>

                          <span className="text-muted-foreground">
                            {(evidence.similarityScore * 100).toFixed(1)}%
                            similarity
                          </span>
                        </div>

                        <p className="text-muted-foreground">
                          {evidence.evidenceText}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
