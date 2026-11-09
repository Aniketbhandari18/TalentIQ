import { ChevronRight } from "lucide-react";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useBreadcrumbContext } from "./BreadcrumbContext";
import { useEffect } from "react";

export default function AppHeader() {
  const pathname = usePathname();

  const { candidateName, jobTitle, setCandidateName, setJobTitle } =
    useBreadcrumbContext();

  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);

    if (parts[0] !== "candidates" || !parts[1]) {
      setCandidateName("");
    }

    if (parts[0] !== "jobs" || !parts[1] || parts[1] === "new") {
      setJobTitle("");
    }
  }, [pathname, setCandidateName, setJobTitle]);

  const crumbs = useBreadcrumbs(candidateName, jobTitle);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-md sm:px-4">
      <SidebarTrigger />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-1 items-center gap-1 text-sm"
      >
        {crumbs.map((crumb, i) => (
          <span
            key={`${crumb.label}-${i}`}
            className="flex min-w-0 items-center gap-1"
          >
            {i > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            )}

            {crumb.href ? (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <UserButton />
    </header>
  );
}

type Crumb = {
  label: string;
  href?: string;
};

function useBreadcrumbs(candidateName?: string, jobTitle?: string) {
  const pathname = usePathname();

  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  const root = parts[0];

  if (root === "dashboard") {
    crumbs.push({ label: "Overview" });
  }

  if (root === "candidates") {
    crumbs.push({
      label: "Candidates",
      href: parts[1] ? "/candidates" : undefined,
    });

    if (parts[1]) {
      crumbs.push({
        label: candidateName || "Candidate",
      });
    }
  }

  if (root === "jobs") {
    crumbs.push({
      label: "Jobs",
      href: parts[1] ? "/jobs" : undefined,
    });

    if (parts[1] === "new") {
      crumbs.push({ label: "New job" });
    } else if (parts[1]) {
      crumbs.push({
        label: jobTitle || "Job",
        href: parts[2] ? `/jobs/${parts[1]}` : undefined,
      });

      if (parts[2] === "matches") {
        crumbs.push({ label: "Matches" });
      }

      if (parts[2] === "edit") {
        crumbs.push({ label: "Edit" });
      }
    }
  }

  return crumbs;
}
