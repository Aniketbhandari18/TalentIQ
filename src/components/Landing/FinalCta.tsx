import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl bg-ink px-6 py-14 text-center text-ink-foreground sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80" />
        <h2 className="relative text-3xl font-semibold tracking-tight">
          Start building your candidate pool today.
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-ink-foreground/70">
          Upload your first batch of resumes and see structured profiles in
          minutes.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/sign-in">
              Get Started <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
