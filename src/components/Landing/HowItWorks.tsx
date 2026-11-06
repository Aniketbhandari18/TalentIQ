import { BrainCircuit, FileSearch, Layers, Upload } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Upload resumes",
    text: "Drop in multiple PDFs. Each file is parsed into a structured candidate profile.",
  },
  {
    icon: FileSearch,
    title: "Create a job",
    text: "Paste a job description and extract skill groups, experience, and education requirements.",
  },
  {
    icon: Layers,
    title: "Review requirements",
    text: "Edit what was extracted so the evaluation reflects what you actually need.",
  },
  {
    icon: BrainCircuit,
    title: "Evaluate & decide",
    text: "Compare ranked candidates with evidence, then shortlist, reject, or flag for review.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Four steps from inbox to shortlist.
          </h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-xl border bg-card p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <s.icon className="size-5 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
