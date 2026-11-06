import {
  BrainCircuit,
  ListChecks,
  Lightbulb,
  ScanText,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Candidate Pool",
    text: "One searchable home for every candidate, filterable by skills, location, and experience.",
  },
  {
    icon: ScanText,
    title: "Resume Parsing",
    text: "Batch-upload PDFs and extract contact details, experience timelines, projects, and education.",
  },
  {
    icon: ListChecks,
    title: "Job Requirement Extraction",
    text: "Turn a job description into skill groups — all required, any one, or preferred — plus education rules.",
  },
  {
    icon: BrainCircuit,
    title: "Candidate Evaluation",
    text: "Score candidates across skills, experience, role alignment, education, and location.",
  },
  {
    icon: Lightbulb,
    title: "Explainable Hiring Insights",
    text: "Every score links back to resume evidence, missing requirements, and areas to verify.",
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Features</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Everything between “resume received” and “shortlist ready.”
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={
                i === 0
                  ? "group rounded-xl border bg-ink p-6 text-ink-foreground shadow-elevated lg:row-span-2"
                  : "group rounded-xl border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
              }
            >
              <div
                className={
                  i === 0
                    ? "grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"
                    : "grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"
                }
              >
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p
                className={
                  i === 0
                    ? "mt-2 text-sm text-ink-foreground/70"
                    : "mt-2 text-sm text-muted-foreground"
                }
              >
                {f.text}
              </p>
              {i === 0 && (
                <div className="mt-8 space-y-2">
                  {[
                    "React · TypeScript · Next.js",
                    "Python · SQL · PyTorch",
                    "Kubernetes · Terraform · AWS",
                  ].map((s) => (
                    <div
                      key={s}
                      className="rounded-lg border border-ink-foreground/10 bg-ink-foreground/5 px-3 py-2 text-xs text-ink-foreground/80"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
