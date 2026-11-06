import { Logo } from "../shared/primitives";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-6 sm:px-6 md:flex-row">
        <Logo />

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground">
            How It Works
          </a>
          <a href="#why" className="hover:text-foreground">
            Why TalentIQ
          </a>
        </nav>

        <p className="text-xs text-muted-foreground">
          © 2026 TalentIQ. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
