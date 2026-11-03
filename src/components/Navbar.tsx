import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Tektur } from "next/font/google";

const tektur = Tektur({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-tektur",
});

export default function Navbar() {
  return (
    <nav className="fixed z-1000 w-full mx-auto px-4 sm:px-6 lg:px-6 bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center h-16">
        <Link href="/">
          <span
            className={`text-xl font-semibold text-gray-700 ${tektur.className}`}
          >
            TalentIQ
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="hover:text-indigo-600 hover:bg-indigo-50"
              >
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </Show>

          <Show when="signed-out">
            <SignInButton>
              <Button variant="outline">Sign in</Button>
            </SignInButton>
            <SignUpButton>
              <Button>Sign up</Button>
            </SignUpButton>
          </Show>
        </div>
      </div>
    </nav>
  );
}
