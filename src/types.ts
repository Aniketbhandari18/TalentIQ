import { SkillGroupType } from "@prisma/client";

export type clerkUserPayload = {
  clerkId: string;
  email: string;
};

export type EvaluationStatus =
  | "PENDING"
  | "SHORTLISTED"
  | "REJECTED"
  | "NEEDS_REVIEW";

export interface SkillMatch {
  skill: string;
  groupCategory: string;
  requirementType: SkillGroupType;
  /** Where the skill was observed in the resume. */
  foundIn: Array<"skills" | "experience" | "projects">;
}

export interface MissingSkillGroup {
  groupId: string;
  category: string;
  requirementType: Exclude<SkillGroupType, "PREFERRED">;
  missingSkills: string[];
}

export interface ResumeEvidence {
  source: "experience" | "project" | "education" | "summary";
  label: string;
  excerpt: string;
}

export interface EducationAssessment {
  meetsMinimumLevel: boolean | null;
  matchedDegree: string | null;
  fieldOfStudyMatch: boolean | null;
  note: string;
}

export interface MatchResult {
  id: string;
  candidateId: string;
  jobId: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  roleAlignmentScore: number;
  educationScore: number;
  locationScore: number;
  status: EvaluationStatus;
  evaluatedAt: string;
  matchingSkills: SkillMatch[];
  missingRequiredSkills: MissingSkillGroup[];
  preferredSkillsFound: string[];
  preferredSkillsNotFound: string[];
  relevantExperience: Array<{
    experienceId: string;
    position: string;
    company: string;
    months: number;
  }>;
  educationAssessment: EducationAssessment;
  resumeEvidence: ResumeEvidence[];
  reviewFlags: string[];
  notes: string;
}
