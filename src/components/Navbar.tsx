import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Logo } from "./shared/primitives";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#why", label: "Why TalentIQ" },
];

export default function Navbar() {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-colors",
        "border-b bg-background/85 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          aria-label="TalentIQ home"
          className="flex shrink-0 items-center"
        >
          <Logo />
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Authentication */}
        <div className="flex h-full shrink-0 items-center gap-2">
          <Suspense>
            <Show when="signed-in">
              <Link href="/dashboard" className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 hover:bg-primary-soft hover:text-primary"
                >
                  Dashboard
                </Button>
              </Link>

              <UserButton />
            </Show>

            <Show when="signed-out">
              <SignInButton>
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </SignInButton>

              <SignUpButton>
                <Button size="sm">Get Started</Button>
              </SignUpButton>
            </Show>
          </Suspense>
        </div>
      </div>
    </header>
  );
}
