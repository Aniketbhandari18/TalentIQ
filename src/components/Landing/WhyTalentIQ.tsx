import { ShieldCheck } from "lucide-react";

const WHY = [
  {
    title: "Explainable by design",
    text: "Scores are a starting point with visible reasoning — never a hiring verdict.",
  },
  {
    title: "Gaps aren't treated as facts",
    text: "If a skill isn't in the resume, TalentIQ flags it to verify rather than assuming it's missing.",
  },
  {
    title: "Structured, not flattened",
    text: "Skill groups and accepted degrees keep their nuance, so “any one of” stays different from “all of”.",
  },
  {
    title: "Recruiter in control",
    text: "Edit extracted requirements, add notes, and decide who moves forward.",
  },
];

export default function WhyTalentIQ() {
  return (
    <section id="why" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-sm font-medium text-primary">Why TalentIQ</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Built to support judgment, not replace it.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Hiring is a human decision. TalentIQ organises the information so
            you can make it faster and more consistently.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-card">
            <ShieldCheck className="size-4 text-success" />
            Candidates never need an account
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {WHY.map((w) => (
            <div
              key={w.title}
              className="rounded-xl border bg-card p-5 shadow-card"
            >
              <h3 className="text-sm font-semibold">{w.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{w.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
