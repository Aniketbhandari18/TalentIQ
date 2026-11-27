export type SkillEvidenceType = "LISTED" | "EXPLICIT" | "INFERRED";

export type SkillEvidenceSource =
  | "SKILLS_SECTION"
  | "PROJECT"
  | "WORK_EXPERIENCE"
  | "NONE";

export type CandidateSkillEvidenceSource = Exclude<SkillEvidenceSource, "NONE">;

export interface SkillRequirementResult {
  skillRequirementId: string;
  name: string;
  normalizedName: string;

  evidenceType: SkillEvidenceType | null;
  evidenceSource: SkillEvidenceSource;

  credit: number;

  evidenceTitle: string | null;
  evidence: string | null;
  companyName: string | null;
}

export interface SkillGroupResult {
  skillGroupId: string;
  category: string;
  requirementType: "ALL" | "ANY" | "PREFERRED";

  score: number;
  weight: number;

  totalSkills: number;
  matchedSkills: number;
  demonstratedSkills: number;
  listedSkills: number;
  missingSkills: number;

  requirements: SkillRequirementResult[];
}

export interface SkillEvaluationResult {
  score: number | null;

  requiredScore: number;
  preferredScore: number;

  totalGroups: number;
  totalRequirements: number;

  matchedSkills: number;
  demonstratedSkills: number;
  listedSkills: number;
  missingSkills: number;

  groups: SkillGroupResult[];
}

export interface JobSkillRequirementInput {
  id: string;
  name: string;
  normalizedName: string;
}

export interface JobSkillGroupInput {
  id: string;
  category: string;
  requirementType: "ALL" | "ANY" | "PREFERRED";
  requirements: JobSkillRequirementInput[];
}

export interface CandidateSkillInput {
  name: string;
  normalizedName: string;
  evidenceSource: SkillEvidenceSource;

  evidenceTitle: string | null;
  companyName: string | null;
  evidenceText: string | null;
}

export interface CandidateSkillData {
  skills: CandidateSkillInput[];
}

export interface SkillEvaluationInput {
  jobGroups: JobSkillGroupInput[];
  candidate: CandidateSkillData;
}

export interface WorkExperienceInput {
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}

export interface CandidateEducationInput {
  id: string;
  degreeName: string;
  normalizedDegreeName: string;
  fieldOfStudy: string | null;
  normalizedFieldOfStudy: string | null;
}

export interface AcceptedDegreeInput {
  id: string;
  degreeName: string;
  normalizedDegreeName: string;
  acceptedFieldOfStudy: string[];
  normalizedAcceptedFieldOfStudy: string[];
  isFieldOfStudyMandatory: boolean;
}

export interface JobEducationRequirementInput {
  minEducationLevel: string | null;
  acceptedDegrees: AcceptedDegreeInput[];
  relatedDegreesAllowed: boolean;
  isMandatory: boolean;
  relatedDegreeFieldsOfStudy: string[];
  normalizedRelatedDegreeFieldsOfStudy: string[];
}

export interface DegreeFieldResult {
  educationRecordId: string;
  score: number;
  matchType: "ACCEPTED_DEGREE" | "ALTERNATIVE_DEGREE" | "NO_MATCH";

  matchedDegree: string | null;
  candidateDegree: string;
  candidateFieldOfStudy: string | null;

  fieldMatch: "EXACT" | "RELATED" | "NONE" | "NOT_REQUIRED";
}

export interface JobResponsibilityInput {
  id: string;
  responsibility: string;
  embedding: number[];
  weight: number;
}

export interface EvaluateResponsibilitiesInput {
  responsibilities: JobResponsibilityInput[];
  candidatePoints: CandidatePointInput[];
}

export interface CandidatePointInput {
  id: string;
  content: string;
  embedding: number[];
  sourceType: "PROJECT" | "EXPERIENCE";
  sourceTitle: string | null;
}

export interface CandidateSkillEvidence {
  skill: string;
  normalizedSkill: string;
  source: CandidateSkillEvidenceSource;
  evidenceType: SkillEvidenceType;
  sourceTitle: string | null;
  evidence: string | null;
  companyName: string | null;
}

export interface CandidateDimensionScores {
  responsibilityScore: number | null;
  skillScore: number | null;
  educationScore: number | null;
  experienceScore: number | null;
  educationIsMandatory: boolean | null;
}

export interface CandidateRankingResult {
  overallScore: number | null;
  responsibilityScore: number | null;
  skillScore: number | null;
  educationScore: number | null;
  experienceScore: number | null;
}

export interface EvaluateCandidateMatchInput {
  responsibilityInput: EvaluateResponsibilitiesInput;

  jobSkillGroups: JobSkillGroupInput[];
  candidateSkillEvidence: CandidateSkillEvidence[];

  candidateEducations: CandidateEducationInput[];
  candidateHighestEducationLevel: string;
  educationRequirement: JobEducationRequirementInput | null;
  fieldMapping: Record<string, string[]>;

  experiences: WorkExperienceInput[];
  requiredExperienceYears: number | null;
}

export interface ScoreSkillGroupParams {
  requirementType: "ALL" | "ANY" | "PREFERRED";
  skillCredits: number[];
}

export interface ScoreSkillPoolsResult {
  requiredScore: number;
  preferredScore: number;
  totalScore: number;
}

export type ResponsibilityMatchLevel = "STRONG" | "PARTIAL" | "WEAK" | "NONE";

export interface ResponsibilityEvaluationInput {
  responsibilityEmbedding: number[];
  candidatePoints: CandidatePointInput[];
}

export interface ResponsibilityEvaluationResult {
  score: number;
  bestSimilarity: number | null;
  matchLevel: ResponsibilityMatchLevel;
  matchedEvidenceCount: number;
  evidence: {
    pointEmbeddingId: string;
    evidenceText: string;
    sourceType: "PROJECT" | "EXPERIENCE";
    sourceTitle: string | null;
    similarityScore: number;
    isPrimary: boolean;
  }[];
}

export interface EvaluateResponsibilitiesResult {
  score: number | null;
  totalResponsibilities: number;
  matchedResponsibilities: number;
  results: {
    jobResponsibilityId: string;
    responsibilityText: string;
    weight: number;
    score: number;
    bestSimilarity: number | null;
    matchLevel: ResponsibilityMatchLevel;
    matchedEvidenceCount: number;
    evidence: ResponsibilityEvaluationResult["evidence"];
  }[];
}

export interface EvaluateExperienceParams {
  experiences: WorkExperienceInput[];
  requiredYears: number | null;
  evaluationDate?: Date;
}

export interface ExperienceEvaluationResult {
  score: number | null;
  totalExperienceMonths: number;
  requiredExperienceMonths: number | null;
}

export interface ScoreEducationLevelParams {
  candidateLevel: string;
  requiredLevel: string;
}

export type FieldMatchType = "EXACT" | "RELATED" | "NONE";

export interface ScoreDegreeFieldParams {
  candidate: CandidateEducationInput;
  requirement: JobEducationRequirementInput;
  fieldMapping: Record<string, string[]>;
}

export interface EvaluateDegreeFieldParams {
  candidate: CandidateEducationInput;
  requirement: JobEducationRequirementInput;
  fieldMapping: Record<string, string[]>;
}

export interface EvaluateEducationParams {
  candidateEducations: CandidateEducationInput[];
  candidateHighestEducationLevel: string;
  requirement: JobEducationRequirementInput;
  fieldMapping: Record<string, string[]>;
}

export interface EducationEvaluationResult {
  score: number | null;
  levelScore: number | null;
  degreeFieldScore: number | null;
  bestDegreeFieldMatch: DegreeFieldResult | null;

  meetsMinimumLevel: boolean | null;
  acceptedDegreeMatched: boolean | null;
  fieldOfStudyMatched: boolean | null;
  relatedDegreeUsed: boolean;
  matchedEducationRecordId: string | null;
}
