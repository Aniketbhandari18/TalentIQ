import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProductPreview from "./ProductPreview";
import { Show, SignUpButton } from "@clerk/nextjs";
import { Suspense } from "react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-card transition-colors hover:text-foreground"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            Resume intelligence for recruiting teams
            <ArrowRight className="size-3" />
          </a>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance-pretty sm:text-6xl">
            Hire smarter.{" "}
            <span className="text-primary">Discover the right talent.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground text-balance-pretty sm:text-lg">
            TalentIQ turns stacks of resumes into structured, searchable
            candidate profiles — then evaluates them against your job
            requirements with transparent, evidence-backed insights.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Suspense>
              <Show when="signed-in">
                <Link href="/dashboard" className="flex items-center">
                  <Button size="lg">
                    Dashboard <ArrowRight />
                  </Button>
                </Link>
              </Show>

              <Show when="signed-out">
                <SignUpButton>
                  <Button size="lg">
                    Get Started <ArrowRight />
                  </Button>
                </SignUpButton>
              </Show>
            </Suspense>

            <Button size="lg" variant="outline" asChild>
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </div>
        <div className="mt-16">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
