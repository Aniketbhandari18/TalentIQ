"use client";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InitialsAvatar,
  Pill,
  SectionCard,
  type PillTone,
  RequirementTypeBadge,
} from "@/components/shared/primitives";

import { ScoreBar, ScoreRing } from "@/components/shared/status";

import { formatExperience, totalExperienceMonths } from "@/lib/talentUtils";
import { capitalizeName } from "@/lib/capitalize";

type EvaluationJob = Prisma.JobGetPayload<{
  include: {
    skillGroups: {
      include: {
        skills: true;
      };
    };
    educationRequirement: {
      select: {
        isMandatory: true;
      };
    };
    JobResponsibilities: {
      select: {
        id: true;
        responsibility: true;
      };
    };
  };
}>;

type EvaluationMatch = Prisma.CandidateMatchGetPayload<{
  include: {
    candidate: {
      include: {
        experience: {
          select: {
            company: true;
            position: true;
            startDate: true;
            endDate: true;
          };
        };
        education: {
          select: {
            id: true;
            degree: true;
            fieldOfStudy: true;
            institution: true;
          };
        };
      };
    };
    skillGroups: {
      include: {
        skillResults: true;
      };
    };
    educationEvaluation: true;
    experienceEvaluation: true;
    responsibilityMatches: {
      include: {
        evidence: {
          select: {
            id: true;
            evidenceText: true;
            sourceType: true;
            sourceTitle: true;
            similarityScore: true;
            isPrimary: true;
          };
        };
      };
    };
  };
}>;

type EvaluationCandidate = EvaluationMatch["candidate"];

type SkillGroup = EvaluationMatch["skillGroups"][number];

type SkillResult = SkillGroup["skillResults"][number];

type ResponsibilityMatch = EvaluationMatch["responsibilityMatches"][number];

type SkillEvidenceType = SkillResult["evidenceType"];

type SkillEvidenceSource = SkillResult["evidenceSource"];

type ResponsibilityMatchLevel = ResponsibilityMatch["matchLevel"];

type EvaluationViewProps = {
  job: EvaluationJob;
  candidate: EvaluationCandidate;
  result: EvaluationMatch;
  prevId: string | null;
  nextId: string | null;
};

const SCORE_WEIGHTS = {
  skill: 0.3,
  experience: 0.15,
  responsibility: 0.4,
  education: 0.15,
};

const MATCH_TIER_LABEL = {
  strong: "Strong match",
  potential: "Potential match",
  low: "Low match",
};

const TIER_TONE: Record<"strong" | "potential" | "low", PillTone> = {
  strong: "success",
  potential: "primary",
  low: "neutral",
};

function matchTier(score: number | null) {
  if (score !== null && score >= 80) {
    return "strong";
  }

  if (score !== null && score >= 60) {
    return "potential";
  }

  return "low";
}

function isGroupUnmet(group: SkillGroup) {
  if (group.requirementType === "PREFERRED") {
    return false;
  }

  if (group.requirementType === "ALL") {
    return group.missingCount > 0;
  }

  return group.matchedCount === 0;
}

function getReviewFlags({
  result,
  candidate,
  job,
}: Pick<EvaluationViewProps, "result" | "candidate" | "job">) {
  const flags: string[] = [];

  if (result.skillGroups.some(isGroupUnmet)) {
    flags.push("One or more required skill groups are not fully met.");
  }

  if (result.experienceEvaluation?.meetsMinimumExperience === false) {
    flags.push("Candidate experience is below the job's minimum requirement.");
  }

  if (result.experienceEvaluation?.meetsMaximumExperience === false) {
    flags.push("Candidate experience exceeds the job's maximum requirement.");
  }

  if (
    job.educationRequirement?.isMandatory &&
    result.educationEvaluation?.acceptedDegreeMatched === false
  ) {
    flags.push("The mandatory education requirement was not matched.");
  }

  if (
    result.responsibilityMatches.some(
      (responsibility) =>
        responsibility.matchLevel === "WEAK" ||
        responsibility.matchLevel === "NONE",
    )
  ) {
    flags.push("Some job responsibilities have limited resume evidence.");
  }

  if (!candidate.email && !candidate.phone) {
    flags.push("No email address or phone number was extracted.");
  }

  return flags;
}

export default function EvaluationView({
  job,
  candidate,
  result,
  prevId,
  nextId,
}: EvaluationViewProps) {
  const tier = matchTier(result.overallScore);

  const reviewFlags = getReviewFlags({
    job,
    candidate,
    result,
  });

  return (
    <div className="space-y-5">
      {/* Top navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          asChild
        >
          <Link href={`/jobs/${job.id}/matches`}>
            <ArrowLeft /> All matches · {job.title}
          </Link>
        </Button>

        {(prevId || nextId) && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevId}
              asChild={!!prevId}
            >
              {prevId ? (
                <Link href={`/jobs/${job.id}/matches/${prevId}`}>
                  <ChevronLeft /> Previous
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ChevronLeft /> Previous
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!nextId}
              asChild={!!nextId}
            >
              {nextId ? (
                <Link href={`/jobs/${job.id}/matches/${nextId}`}>
                  Next <ChevronRight />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Next <ChevronRight />
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Candidate header */}
      <div className="rounded-xl border bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <InitialsAvatar
              name={capitalizeName(candidate.name || "Candidate")}
              className="size-14 text-lg"
            />

            <div className="min-w-0">
              <h1 className="wrap-break-word text-2xl font-semibold tracking-tight">
                {candidate.name ?? "Unnamed candidate"}
              </h1>

              <p className="mt-0.5 text-balance-pretty text-sm text-muted-foreground">
                Evaluated against{" "}
                <span className="font-medium text-foreground">{job.title}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {candidate.email && (
                  <a
                    href={`mailto:${candidate.email}`}
                    className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground"
                  >
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{candidate.email}</span>
                  </a>
                )}

                {candidate.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {candidate.phone}
                  </span>
                )}

                {candidate.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {candidate.location}
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="size-3.5" />
                  {formatExperience(
                    totalExperienceMonths(candidate.experience),
                  )}{" "}
                  derived
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone={TIER_TONE[tier]}>{MATCH_TIER_LABEL[tier]}</Pill>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-4 lg:items-end">
            <div className="flex items-center gap-3">
              <ScoreRing
                value={result.overallScore || 0}
                size={64}
                stroke={5}
              />

              <div className="text-sm">
                <p className="font-medium">Overall score</p>
                <p className="text-muted-foreground">
                  Weighted across four areas
                </p>
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="min-w-28 flex-1 sm:flex-none"
                asChild
              >
                <Link href={`/candidates/${candidate.id}`}>
                  <ExternalLink /> Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <p className="rounded-lg border bg-surface px-4 py-3 text-xs text-muted-foreground">
        Illustrative evaluation. Scores summarise how the resume aligns with
        this job&apos;s listed requirements — they are not hiring probabilities
        or decisions, and a skill missing from a resume isn&apos;t proof the
        candidate lacks it.
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <ScoreBreakdown result={result} />
          <SkillGroups result={result} />
          <Responsibilities result={result} />
          <ReviewFlags flags={reviewFlags} />
        </div>

        <aside className="space-y-5">
          <ExperienceCard result={result} job={job} />

          <EducationCard result={result} candidate={candidate} job={job} />

          <JobRequirements job={job} />
        </aside>
      </div>
    </div>
  );
}

// ---------- Score breakdown ----------

function ScoreBreakdown({ result }: { result: EvaluationMatch }) {
  const rows = [
    ["Skills", result.skillScore, SCORE_WEIGHTS.skill],
    ["Experience", result.experienceScore, SCORE_WEIGHTS.experience],
    [
      "Responsibilities",
      result.responsibilityScore,
      SCORE_WEIGHTS.responsibility,
    ],
    ["Education", result.educationScore, SCORE_WEIGHTS.education],
  ] as const;

  return (
    <SectionCard
      title="Score breakdown"
      description="Each area is scored 0–100 against the job's requirements."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value, weight]) => (
          <div key={label} className="rounded-lg border p-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{label}</p>

              <p className="text-sm font-semibold tabular-nums">
                {value == null ? "—" : Math.round(value)}
              </p>
            </div>

            <ScoreBar value={value || 0} className="mt-2.5" />

            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {Math.round(weight * 100)}% of the overall score
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ---------- Skill groups ----------

function SkillGroups({ result }: { result: EvaluationMatch }) {
  return (
    <SectionCard
      title="Skill groups"
      description="Every required skill with the resume line it was matched to."
      action={<Pill tone="primary">{result.skillGroups.length} groups</Pill>}
    >
      {result.skillGroups.length === 0 ? (
        <Muted>This job has no skill requirements.</Muted>
      ) : (
        <ul className="space-y-4">
          {result.skillGroups.map((group) => (
            <li key={group.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <RequirementTypeBadge type={group.requirementType} />

                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {group.category}
                </span>

                {isGroupUnmet(group) && <Pill tone="warning">Not met</Pill>}

                <span className="text-xs text-muted-foreground tabular-nums">
                  {group.matchedCount}/{group.totalCount} found
                </span>
              </div>

              <ScoreBar value={group.score} className="mt-3" />

              <p className="mt-2 text-[11px] text-muted-foreground">
                {group.demonstratedCount} explicit or inferred ·{" "}
                {group.listedCount} listed only · {group.missingCount} not found
              </p>

              <ul className="mt-3 space-y-2">
                {group.skillResults.map((skill) => (
                  <li
                    key={skill.id}
                    className="rounded-lg border bg-background/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <SkillStatusChip type={skill.evidenceType} />

                        <span className="truncate text-sm font-medium">
                          {skill.name}
                        </span>
                      </div>

                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {Math.round(skill.credit * 100)}%
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {skill.evidenceType === null
                        ? "Not found in resume"
                        : `${EVIDENCE_LABEL[skill.evidenceSource]}${
                            skill.evidenceTitle
                              ? ` · ${skill.evidenceTitle}`
                              : ""
                          }${
                            skill.companyName ? ` at ${skill.companyName}` : ""
                          }`}
                    </p>

                    {skill.evidence && (
                      <p className="mt-2 border-l-2 border-border pl-3 text-xs leading-relaxed italic text-muted-foreground">
                        &quot;{skill.evidence}&quot;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}

          <li className="text-xs text-muted-foreground">
            Not mentioned doesn&apos;t mean not known — verify during screening.
          </li>
        </ul>
      )}
    </SectionCard>
  );
}

// ---------- Responsibilities ----------

function Responsibilities({ result }: { result: EvaluationMatch }) {
  return (
    <SectionCard
      title="Responsibilities"
      description="Job responsibilities with the resume evidence that supports each one."
      action={
        <Pill tone="primary">{result.responsibilityMatches.length} listed</Pill>
      }
    >
      {result.responsibilityMatches.length === 0 ? (
        <Muted>This job has no listed responsibilities.</Muted>
      ) : (
        <ul className="space-y-3">
          {result.responsibilityMatches.map((responsibility) => (
            <li key={responsibility.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-sm leading-relaxed">
                  {responsibility.responsibilityText}
                </p>

                <LevelChip level={responsibility.matchLevel} />
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground">
                Weight {responsibility.weight} ·{" "}
                {responsibility.matchedEvidenceCount} evidence point
                {responsibility.matchedEvidenceCount === 1 ? "" : "s"}
                {responsibility.bestSimilarity != null
                  ? ` · best similarity ${Math.round(
                      responsibility.bestSimilarity * 100,
                    )}%`
                  : ""}
              </p>

              {responsibility.evidence.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {responsibility.evidence.map((evidence) => (
                    <li
                      key={evidence.id}
                      className={
                        evidence.isPrimary
                          ? "rounded-md border-l-2 border-primary/50 bg-surface px-3 py-2"
                          : "rounded-md border-l-2 border-border bg-surface px-3 py-2"
                      }
                    >
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {evidence.sourceTitle ?? evidence.sourceType} ·{" "}
                        {Math.round(evidence.similarityScore * 100)}%
                        {evidence.isPrimary ? " · strongest" : ""}
                      </p>

                      <p className="mt-1 text-xs leading-relaxed">
                        {evidence.evidenceText}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ---------- Review flags ----------

function ReviewFlags({ flags }: { flags: string[] }) {
  return (
    <SectionCard
      title="Areas requiring review"
      description="Things worth confirming during screening."
    >
      {flags.length === 0 ? (
        <Muted>Nothing flagged.</Muted>
      ) : (
        <ul className="space-y-2">
          {flags.map((flag, index) => (
            <li
              key={index}
              className="flex gap-2.5 rounded-lg bg-warning-soft/60 px-3 py-2 text-sm text-warning-foreground"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{flag}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ---------- Experience ----------

function ExperienceCard({
  result,
  job,
}: {
  result: EvaluationMatch;
  job: EvaluationJob;
}) {
  const experience = result.experienceEvaluation;

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground" />
          Experience
        </span>
      }
    >
      {experience ? (
        <>
          <p className="text-sm">
            <span className="font-semibold tabular-nums">
              {experience.totalWorkExperience}
            </span>{" "}
            years of derived work experience
            {job.minExperience != null || job.maxExperience != null ? (
              <span className="text-muted-foreground">
                {" "}
                · job asks for {job.minExperience ?? 0}
                {job.maxExperience != null ? `–${job.maxExperience}` : "+"} yrs
              </span>
            ) : null}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Check
              label="Meets minimum"
              value={experience.meetsMinimumExperience}
            />

            <Check
              label="Within maximum"
              value={experience.meetsMaximumExperience}
            />
          </div>
        </>
      ) : (
        <Muted>Experience not evaluated.</Muted>
      )}
    </SectionCard>
  );
}

// ---------- Education ----------

function EducationCard({
  result,
  candidate,
  job,
}: {
  result: EvaluationMatch;
  candidate: EvaluationCandidate;
  job: EvaluationJob;
}) {
  const education = result.educationEvaluation;

  const matchedEducation = education?.matchedEducationRecordId
    ? (candidate.education.find(
        (item) => item.id === education.matchedEducationRecordId,
      ) ?? null)
    : null;

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <GraduationCap className="size-4 text-muted-foreground" />
          Education
        </span>
      }
    >
      {education ? (
        <>
          <p className="text-sm leading-relaxed">
            {!job.educationRequirement
              ? "No education requirement for this job."
              : matchedEducation
                ? `Best match: ${matchedEducation.degree ?? "Degree"}${
                    matchedEducation.fieldOfStudy
                      ? ` in ${matchedEducation.fieldOfStudy}`
                      : ""
                  }${
                    matchedEducation.institution
                      ? `, ${matchedEducation.institution}`
                      : ""
                  }${education.relatedDegreeUsed ? " (related field)" : ""}.`
                : candidate.education.length === 0
                  ? "No education details found in resume."
                  : "No accepted degree matched."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Check
              label="Meets minimum level"
              value={education.meetsMinimumLevel}
            />

            <Check
              label="Accepted degree"
              value={education.acceptedDegreeMatched}
            />

            <Check
              label="Field of study"
              value={education.fieldOfStudyMatched}
            />
          </div>
        </>
      ) : (
        <Muted>Education not evaluated.</Muted>
      )}
    </SectionCard>
  );
}

// ---------- Job requirements ----------

function JobRequirements({ job }: { job: EvaluationJob }) {
  return (
    <SectionCard
      title="Job requirements"
      description="What this evaluation was scored against."
    >
      <dl className="space-y-2.5 text-sm">
        <Row
          label="Experience"
          value={
            job.minExperience != null || job.maxExperience != null
              ? `${job.minExperience ?? 0}${
                  job.maxExperience != null ? `–${job.maxExperience}` : "+"
                } yrs`
              : "Not specified"
          }
        />

        <Row label="Skill groups" value={String(job.skillGroups.length)} />

        <Row
          label="Responsibilities"
          value={String(job.JobResponsibilities.length)}
        />

        <Row
          label="Education"
          value={
            job.educationRequirement
              ? job.educationRequirement.isMandatory
                ? "Mandatory"
                : "Preferred"
              : "Not specified"
          }
        />
      </dl>

      <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
        <Link href={`/jobs/${job.id}`}>
          <FileText /> Job details
        </Link>
      </Button>
    </SectionCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

// ---------- Shared bits ----------

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Check({ label, value }: { label: string; value: boolean | null }) {
  const className =
    value === true
      ? "bg-success-soft text-success"
      : value === false
        ? "bg-warning-soft text-warning-foreground"
        : "bg-muted text-muted-foreground";

  return (
    <span className={`rounded-md px-2 py-0.5 ${className}`}>
      {label}: {value === true ? "Yes" : value === false ? "No" : "Unknown"}
    </span>
  );
}

const EVIDENCE_LABEL: Record<SkillEvidenceSource, string> = {
  PROJECT: "Project",
  WORK_EXPERIENCE: "Work experience",
  SKILLS_SECTION: "Skills section",
  NONE: "None",
};

function SkillStatusChip({ type }: { type: SkillEvidenceType }) {
  const map = {
    EXPLICIT: ["Explicit", "bg-success-soft text-success"],
    INFERRED: ["Inferred", "bg-primary-soft text-primary-soft-foreground"],
    LISTED: ["Listed", "bg-muted text-muted-foreground"],
    MISSING: ["Not found", "border border-dashed text-muted-foreground"],
  } as const;

  const [label, className] = map[type ?? "MISSING"];

  return (
    <span
      className={`w-22 shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function LevelChip({ level }: { level: ResponsibilityMatchLevel }) {
  const map = {
    STRONG: ["Strong", "bg-success-soft text-success"],
    PARTIAL: ["Partial", "bg-primary-soft text-primary-soft-foreground"],
    WEAK: ["Weak", "bg-warning-soft text-warning-foreground"],
    NONE: ["No evidence", "bg-muted text-muted-foreground"],
  } as const;

  const [label, className] = map[level];

  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}
