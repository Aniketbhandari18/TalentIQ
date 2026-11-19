import { Experience } from "@prisma/client";
import { RANKING_CONFIG } from "./ranking/config";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthIndex(date: Date) {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

export function formatDate(date: Date) {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelative(date: Date, now = new Date()) {
  const diff = Math.max(0, now.getTime() - date.getTime());
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(date);
}

/**
 * Total experience derived from Experience records.
 * Overlapping roles are merged so concurrent jobs are not double-counted.
 */
export function totalExperienceMonths(
  experience: Array<Pick<Experience, "startDate" | "endDate">>,
  now = new Date(),
): number {
  const ranges: Array<[number, number]> = experience
    .filter((e) => e.startDate !== null)
    .map((e): [number, number] => [
      monthIndex(new Date(e.startDate!)),
      monthIndex(e.endDate ? new Date(e.endDate) : now),
    ])
    .filter(([s, e]) => e >= s)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let current: [number, number] | null = null;

  for (const [s, e] of ranges) {
    if (!current) {
      current = [s, e];
    } else if (s <= current[1] + 1) {
      current[1] = Math.max(current[1], e);
    } else {
      total += current[1] - current[0] + 1;
      current = [s, e];
    }
  }

  if (current) total += current[1] - current[0] + 1;

  return total;
}
export function formatExperience(months: number | null | undefined): string {
  if (months == null) return "—";
  if (months <= 0) return "No experience listed";
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem} mo${rem === 1 ? "" : "s"}`;
  if (rem === 0) return `${years} yr${years === 1 ? "" : "s"}`;
  return `${years} yr${years === 1 ? "" : "s"} ${rem} mo${rem === 1 ? "" : "s"}`;
}

export function formatExperienceRange(min: number | null, max: number | null) {
  if (min == null && max == null) return "Any experience";
  if (min != null && max != null) return `${min}–${max} yrs`;
  if (min != null) return `${min}+ yrs`;
  return `Up to ${max} yrs`;
}

interface NormalizedExperience {
  startMonth: number;
  endMonth: number;
}

// Why convert dates into numbers?
// Instead of comparing strings such as "2020-06" and "2022-03", we convert each date into a numeric month:
//
// Month Index = Year * 12 + (Month - 1)
//
// For example:
// - June 2020 → 24245
// - June 2021 → 24257
// The difference is exactly 12 months.

// This makes calculating durations and merging overlapping periods much easier.
export function normalizeExperienceDates(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean,
  evaluationDate: Date = new Date(),
): NormalizedExperience | null {
  if (!startDate) {
    return null;
  }

  function parseDate(value: string): number | null {
    const parts = value.split("-");

    const year = Number(parts[0]);
    const month =
      parts.length > 1
        ? Number(parts[1])
        : RANKING_CONFIG.experience.yearOnlyMonth;

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return null;
    }

    return year * 12 + (month - 1);
  }

  const startMonth = parseDate(startDate);

  if (startMonth === null) {
    return null;
  }

  let endMonth: number;

  if (isCurrent) {
    endMonth = evaluationDate.getFullYear() * 12 + evaluationDate.getMonth();
  } else {
    if (!endDate) {
      return null;
    }

    const parsedEndMonth = parseDate(endDate);

    if (parsedEndMonth === null) {
      return null;
    }

    endMonth = parsedEndMonth;
  }

  if (endMonth < startMonth) {
    return null;
  }

  return {
    startMonth,
    endMonth,
  };
}


export function mergeExperiencePeriods(
  periods: NormalizedExperience[]
): NormalizedExperience[] {
  if (periods.length === 0) {
    return [];
  }

  const sortedPeriods = [...periods].sort(
    (a, b) => a.startMonth - b.startMonth
  );

  const mergedPeriods: NormalizedExperience[] = [];

  let currentPeriod = { ...sortedPeriods[0] };

  for (let i = 1; i < sortedPeriods.length; i++) {
    const nextPeriod = sortedPeriods[i];

    if (nextPeriod.startMonth <= currentPeriod.endMonth + 1) {
      currentPeriod.endMonth = Math.max(
        currentPeriod.endMonth,
        nextPeriod.endMonth
      );
    } else {
      mergedPeriods.push(currentPeriod);
      currentPeriod = { ...nextPeriod };
    }
  }

  mergedPeriods.push(currentPeriod);

  return mergedPeriods;
}