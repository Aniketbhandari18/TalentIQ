"use client";

import Link from "next/link";
import { EmptyState, PageHeader, StatCard } from "../shared/primitives";
import { Button } from "../ui/button";
import {
  Archive,
  Briefcase,
  CircleCheck,
  FilePen,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Input } from "../ui/input";
import { JobStatus } from "@prisma/client";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { formatDate, formatExperienceRange } from "@/lib/talentUtils";
import { JobStatusPill } from "../shared/status";
import { PaginationBar } from "../shared/paginationBar";
import { useRouter } from "next/navigation";
import { JobWithRelations } from "@/types";

type Props = {
  jobs: JobWithRelations[];
};

const PAGE_SIZE = 8;

type StatusFilter = "ALL" | JobStatus;

export default function JobsView({ jobs }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const router = useRouter();

  // 1. Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = job.title
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      const matchesStatus = status === "ALL" || job.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, status]);

  // 2. Get jobs for the current page
  const pageRows = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;

    return filteredJobs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredJobs, page]);

  const hasFilters = searchQuery.trim() || status !== "ALL";

  const reset = () => {
    setSearchQuery("");
    setStatus("ALL");
    setPage(1);
  };

  const count = (s: JobStatus) => jobs.filter((j) => j.status === s).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Job descriptions with structured, reviewable requirements."
        actions={
          <Button asChild>
            <Link href="/jobs/new">
              <Plus /> Create job
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total jobs" value={jobs.length} icon={Briefcase} />
        <StatCard label="Active" value={count("ACTIVE")} icon={CircleCheck} />
        <StatCard label="Draft" value={count("DRAFT")} icon={FilePen} />
        <StatCard label="Closed" value={count("CLOSED")} icon={Archive} />
      </div>

      <div>
        <div className="flex flex-col gap-3 border-b p-3 sm:p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by job title"
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as JobStatus | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-29.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X /> Reset
              </Button>
            ) : null}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-4">
            {jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No jobs yet"
                description="Create your first job to start evaluating candidates."
                action={
                  <Button asChild>
                    <Link href="/jobs/new">
                      <Plus /> Create job
                    </Link>
                  </Button>
                }
                className="border-0"
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No jobs match these filters"
                action={
                  <Button variant="outline" onClick={reset}>
                    Clear filters
                  </Button>
                }
                className="border-0"
              />
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Job</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Education
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((j) => (
                    <TableRow
                      key={j.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/jobs/${j.id}`)}
                    >
                      <TableCell className="max-w-[18rem] pl-4">
                        <p className="truncate text-sm font-medium">
                          {j.title}
                        </p>
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          {j.location ?? "No location"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatExperienceRange(
                          j.minExperience,
                          j.maxExperience,
                        )}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        <EducationSummary job={j} />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        {formatDate(j.createdAt)}
                      </TableCell>
                      <TableCell>
                        <JobStatusPill status={j.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y md:hidden">
              {pageRows.map((j) => (
                <li
                  key={j.id}
                  className="flex items-start gap-3 p-4"
                  onClick={() => router.push(`/jobs/${j.id}`)}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="truncate font-medium">{j.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {j.location ?? "No location"} ·{" "}
                        {formatExperienceRange(
                          j.minExperience,
                          j.maxExperience,
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs">Education:</p>
                      <EducationSummary job={j} />
                    </div>
                  </div>
                  <div>
                    <JobStatusPill status={j.status} />
                  </div>
                </li>
              ))}
            </ul>
            <PaginationBar
              page={page}
              pageSize={PAGE_SIZE}
              total={filteredJobs.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

function EducationSummary({ job }: { job: JobWithRelations }) {
  const er = job.educationRequirement;
  if (!er) return <span className="text-xs">None</span>;
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <GraduationCap className="size-3.5 shrink-0" />
      {er.minEducationLevel ? er.minEducationLevel : "Any level"}
    </span>
  );
}
