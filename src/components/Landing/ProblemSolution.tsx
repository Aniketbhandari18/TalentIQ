import { Check, X } from "lucide-react";

const PROBLEMS = [
  {
    problem: "Hours lost reading resumes one by one",
    solution:
      "Upload dozens of PDFs at once and get structured profiles with skills, roles, projects, and education.",
  },
  {
    problem: "Great past applicants get forgotten",
    solution:
      "Every parsed resume joins a reusable candidate pool you can evaluate against any future job.",
  },
  {
    problem: "Vague job descriptions, inconsistent screening",
    solution:
      "Extract clear skill groups and education rules from a job description, then review and edit them.",
  },
  {
    problem: "Scores with no explanation",
    solution:
      "See matched skills, gaps, and the exact resume lines behind each score — you make the call.",
  },
];

export default function ProblemSolution() {
  return (
    <section className="border-y bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">The problem</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Screening shouldn't be guesswork.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Recruiters juggle inboxes, spreadsheets, and gut feel. TalentIQ
            gives that work structure without taking the decision away from you.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {PROBLEMS.map((p) => (
            <div
              key={p.problem}
              className="rounded-xl border bg-background p-5"
            >
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                {p.problem}
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm font-medium">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {p.solution}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
