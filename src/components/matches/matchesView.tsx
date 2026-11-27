"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { JobExtractionStatus, JobStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  StatCard,
} from "@/components/shared/primitives";

import {
  JobStatusPill,
  MatchTierPill,
  matchTier,
  ScoreBar,
  ScoreRing,
} from "@/components/shared/status";

import { PaginationBar } from "@/components/shared/paginationBar";
import { capitalizeName } from "@/lib/capitalize";
import { formatDate, formatRelative } from "@/lib/talentUtils";
import { MatchTier } from "@/types";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type SortKey =
  | "overallScore"
  | "skillScore"
  | "experienceScore"
  | "responsibilityScore"
  | "educationScore";

type MatchTierFilter = "all" | MatchTier;

type MatchListItem = {
  id: string;
  candidateId: string;
  overallScore: number | null;
  skillScore: number | null;
  experienceScore: number | null;
  responsibilityScore: number | null;
  educationScore: number | null;
  createdAt: string;
  candidate: {
    id: string;
    name: string | null;
    email: string | null;
    location: string | null;
    skills: string[];
  };
};

type MatchesViewProps = {
  job: {
    id: string;
    title: string;
    status: JobStatus;
    extractionStatus: JobExtractionStatus;
    skillGroupCount: number;
    lastEvaluatedAt: Date | null;
  };
  matches: MatchListItem[];
  candidatesCount: number;
  candidateMatchCount: number;
};

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "overallScore", label: "Overall score" },
  { value: "skillScore", label: "Skills" },
  { value: "experienceScore", label: "Experience" },
  { value: "responsibilityScore", label: "Responsibilities" },
  { value: "educationScore", label: "Education" },
];

export default function MatchesView({
  job,
  matches,
  candidatesCount,
  candidateMatchCount,
}: MatchesViewProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<MatchTierFilter>("all");
  const [sort, setSort] = useState<SortKey>("overallScore");
  const [page, setPage] = useState(1);

  const [running, setRunning] = useState(false);

  const isExtractionInProgress =
    job.extractionStatus === "PENDING" || job.extractionStatus === "PROCESSING";
  const hasUnevaluatedCandidates = candidatesCount > candidateMatchCount;
  const rerunMessage = isExtractionInProgress
    ? "Evaluation is currently being processed. Please wait until processing is complete before re-running."
    : !hasUnevaluatedCandidates
      ? "All available candidates have already been evaluated. There are no new candidates to evaluate."
      : null;

  const canEvaluate = !isExtractionInProgress && hasUnevaluatedCandidates;

  async function runEvaluation() {
    setRunning(true);

    try {
      const response = await fetch("/api/job/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to start evaluation.");
        return;
      }

      toast.success("Evaluation queued. Results will update after processing");
    } catch (error) {
      console.error("Evaluation error:", error);

      toast.error("Something went wrong. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  // Rank candidates by overall score.
  const ranked = useMemo(() => {
    return [...matches]
      .sort((a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1))
      .map((match, index) => ({
        ...match,
        rank: index + 1,
      }));
  }, [matches]);

  // Apply tier and search filters, then sort the results.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ranked
      .filter((match) => {
        return tier === "all" || matchTier(match.overallScore) === tier;
      })
      .filter((match) => {
        if (!q) return true;

        const candidate = match.candidate;

        const searchableText = [
          candidate.name,
          candidate.email,
          candidate.location,
          ...candidate.skills,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(q);
      })
      .sort((a, b) => {
        const scoreDifference = (b[sort] ?? -1) - (a[sort] ?? -1);

        return scoreDifference || a.rank - b.rank;
      });
  }, [ranked, query, tier, sort]);

  // Match tier statistics.
  const strong = matches.filter(
    (match) => matchTier(match.overallScore) === "strong",
  ).length;

  const potential = matches.filter(
    (match) => matchTier(match.overallScore) === "potential",
  ).length;

  const low = matches.filter(
    (match) => matchTier(match.overallScore) === "low",
  ).length;

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openMatch(candidateId: string) {
    router.push(`/jobs/${job.id}/matches/${candidateId}`);
  }

  function handleSearch(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleTierChange(value: string) {
    setTier(value as MatchTierFilter);
    setPage(1);
  }

  function handleSortChange(value: string) {
    setSort(value as SortKey);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        asChild
      >
        <Link href={`/jobs/${job.id}`}>
          <ArrowLeft className="mr-1 size-4" />
          {job.title}
        </Link>
      </Button>

      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <JobStatusPill status={job.status} />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Matching results
            <span className="text-muted-foreground"> · {job.title}</span>
          </h1>

          <p className="text-sm text-muted-foreground">
            {job.lastEvaluatedAt
              ? `Last evaluated on ${formatDate(job.lastEvaluatedAt)} (${formatRelative(job.lastEvaluatedAt)})`
              : "This job has not been evaluated yet."}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    onClick={runEvaluation}
                    disabled={running || !canEvaluate}
                  >
                    {running ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-4" />
                    )}

                    {running
                      ? "Queueing..."
                      : job.lastEvaluatedAt
                        ? "Re-run evaluation"
                        : "Run evaluation"}
                  </Button>
                </span>
              </TooltipTrigger>

              {rerunMessage && (
                <TooltipContent className="max-w-xs">
                  <p>{rerunMessage}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Information banner */}
      <div className="flex items-start gap-2.5 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />

        <p>
          Candidates are ranked according to their alignment with this
          job&apos;s requirements. Scores represent matching strength, not
          hiring probabilities or final hiring decisions. Missing evidence does
          not necessarily mean a candidate lacks a skill.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Candidates evaluated"
          value={matches.length}
          hint={`Out of ${candidatesCount} candidates`}
          icon={Users}
        />

        <StatCard
          label="Strong matches"
          value={strong}
          hint="Overall score 75+"
          icon={Target}
        />

        <StatCard
          label="Potential matches"
          value={potential}
          hint="Overall score 55-74"
          icon={TrendingUp}
        />

        <StatCard
          label="Low matches"
          value={low}
          hint="Overall score below 55"
          icon={Briefcase}
        />
      </div>

      {/* Results */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b p-3 sm:p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search candidates or skills"
              className="h-9 pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={tier} onValueChange={handleTierChange}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Match score" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All matches</SelectItem>
                <SelectItem value="strong">Strong (75+)</SelectItem>
                <SelectItem value="potential">Potential (55–74)</SelectItem>
                <SelectItem value="low">Low (below 55)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>

              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {rows.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 pl-4">Rank</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Responsibilities</TableHead>
                    <TableHead>Education</TableHead>
                    <TableHead>Match</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pageRows.map((match) => {
                    const candidate = match.candidate;

                    return (
                      <TableRow
                        key={match.id}
                        className="cursor-pointer"
                        onClick={() => openMatch(match.candidateId)}
                      >
                        <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                          #{match.rank}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <InitialsAvatar
                              name={capitalizeName(candidate.name ?? "Unknown")}
                            />

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {capitalizeName(candidate.name ?? "Unknown")}
                              </p>

                              <p className="truncate text-xs text-muted-foreground">
                                {candidate.email ?? "No email"}
                              </p>

                              {candidate.location && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {candidate.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <ScoreRing
                            value={match.overallScore ?? 0}
                            size={38}
                            stroke={3.5}
                          />
                        </TableCell>

                        <TableCell>
                          <ScoreBar value={match.skillScore ?? 0} />
                        </TableCell>

                        <TableCell>
                          <ScoreBar value={match.experienceScore ?? 0} />
                        </TableCell>

                        <TableCell>
                          <ScoreBar value={match.responsibilityScore ?? 0} />
                        </TableCell>

                        <TableCell>
                          <ScoreBar value={match.educationScore ?? 0} />
                        </TableCell>

                        <TableCell>
                          <MatchTierPill score={match.overallScore} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {pageRows.map((match) => {
                const candidate = match.candidate;

                return (
                  <div key={match.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <InitialsAvatar
                          name={capitalizeName(candidate.name ?? "Unknown")}
                        />

                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {capitalizeName(candidate.name ?? "Unknown")}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {candidate.email ?? "No email"}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-center gap-1">
                        <ScoreRing value={match.overallScore ?? 0} size={42} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Rank #{match.rank}
                      </span>

                      <MatchTierPill score={match.overallScore} />
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">Skills</span>
                        </div>

                        <ScoreBar value={match.skillScore ?? 0} />
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Experience
                          </span>
                        </div>

                        <ScoreBar value={match.experienceScore ?? 0} />
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Responsibilities
                          </span>
                        </div>

                        <ScoreBar value={match.responsibilityScore ?? 0} />
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Education
                          </span>
                        </div>

                        <ScoreBar value={match.educationScore ?? 0} />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => openMatch(match.candidateId)}
                    >
                      View evaluation
                      <ExternalLink className="ml-2 size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={Sparkles}
              title="No matching candidates found"
              description={
                matches.length === 0
                  ? "No candidates have been evaluated for this job yet."
                  : "Try changing your search or match score filters."
              }
            />
          </div>
        )}

        {/* Pagination */}
        {rows.length > 0 && (
          <PaginationBar
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
