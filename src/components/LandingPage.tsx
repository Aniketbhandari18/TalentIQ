import Navbar from "./Navbar";
import HeroSection from "./Landing/HeroSection";
import ProblemSolution from "./Landing/ProblemSolution";
import Features from "./Landing/Features";
import HowItWorks from "./Landing/HowItWorks";
import WhyTalentIQ from "./Landing/WhyTalentIQ";
import Footer from "./Landing/Footer";
import FinalCta from "./Landing/FinalCta";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <WhyTalentIQ />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
