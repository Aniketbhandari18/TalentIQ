-- CreateEnum
CREATE TYPE "SkillMatchStatus" AS ENUM ('DEMONSTRATED', 'LISTED', 'MISSING');

-- CreateEnum
CREATE TYPE "SkillEvidenceSource" AS ENUM ('PROJECT_TECHNOLOGY', 'PROJECT_DESCRIPTION', 'EXPERIENCE_DESCRIPTION', 'SKILLS_SECTION', 'NONE');

-- CreateEnum
CREATE TYPE "ResponsibilityMatchLevel" AS ENUM ('STRONG', 'PARTIAL', 'WEAK', 'NONE');

-- CreateEnum
CREATE TYPE "ResponsibilityEvidenceSource" AS ENUM ('PROJECT', 'EXPERIENCE');

-- CreateTable
CREATE TABLE "CandidateMatch" (
    "id" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "skillScore" DOUBLE PRECISION,
    "educationScore" DOUBLE PRECISION,
    "experienceScore" DOUBLE PRECISION,
    "responsibilityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,

    CONSTRAINT "CandidateMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillGroupMatch" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requirementType" "SkillGroupType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "matchedCount" INTEGER NOT NULL,
    "demonstratedCount" INTEGER NOT NULL,
    "listedCount" INTEGER NOT NULL,
    "missingCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "SkillGroupMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillRequirementMatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "status" "SkillMatchStatus" NOT NULL,
    "evidenceSource" "SkillEvidenceSource" NOT NULL DEFAULT 'NONE',
    "credit" DOUBLE PRECISION NOT NULL,
    "evidenceTitle" TEXT,
    "companyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupMatchId" TEXT NOT NULL,

    CONSTRAINT "SkillRequirementMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationMatch" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "meetsMinimumLevel" BOOLEAN,
    "acceptedDegreeMatched" BOOLEAN,
    "fieldOfStudyMatched" BOOLEAN,
    "relatedDegreeUsed" BOOLEAN NOT NULL DEFAULT false,
    "matchedEducationRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceMatch" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "totalWorkExperience" DOUBLE PRECISION NOT NULL,
    "meetsMinimumExperience" BOOLEAN,
    "meetsMaximumExperience" BOOLEAN,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityMatch" (
    "id" TEXT NOT NULL,
    "responsibilityText" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "bestSimilarity" DOUBLE PRECISION,
    "matchLevel" "ResponsibilityMatchLevel" NOT NULL,
    "matchedEvidenceCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchId" TEXT NOT NULL,
    "jobResponsibilityId" TEXT,

    CONSTRAINT "ResponsibilityMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityEvidence" (
    "id" TEXT NOT NULL,
    "evidenceText" TEXT NOT NULL,
    "sourceType" "ResponsibilityEvidenceSource" NOT NULL,
    "sourceTitle" TEXT,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsibilityMatchId" TEXT NOT NULL,
    "pointEmbeddingId" TEXT,

    CONSTRAINT "ResponsibilityEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateMatch_jobId_overallScore_idx" ON "CandidateMatch"("jobId", "overallScore" DESC);

-- CreateIndex
CREATE INDEX "CandidateMatch_candidateId_idx" ON "CandidateMatch"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateMatch_jobId_candidateId_key" ON "CandidateMatch"("jobId", "candidateId");

-- CreateIndex
CREATE INDEX "SkillGroupMatch_matchId_idx" ON "SkillGroupMatch"("matchId");

-- CreateIndex
CREATE INDEX "SkillRequirementMatch_groupMatchId_idx" ON "SkillRequirementMatch"("groupMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "EducationMatch_matchId_key" ON "EducationMatch"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceMatch_matchId_key" ON "ExperienceMatch"("matchId");

-- CreateIndex
CREATE INDEX "ResponsibilityMatch_matchId_idx" ON "ResponsibilityMatch"("matchId");

-- CreateIndex
CREATE INDEX "ResponsibilityEvidence_responsibilityMatchId_idx" ON "ResponsibilityEvidence"("responsibilityMatchId");

-- CreateIndex
CREATE INDEX "ResponsibilityEvidence_pointEmbeddingId_idx" ON "ResponsibilityEvidence"("pointEmbeddingId");

-- AddForeignKey
ALTER TABLE "CandidateMatch" ADD CONSTRAINT "CandidateMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateMatch" ADD CONSTRAINT "CandidateMatch_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGroupMatch" ADD CONSTRAINT "SkillGroupMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "CandidateMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillRequirementMatch" ADD CONSTRAINT "SkillRequirementMatch_groupMatchId_fkey" FOREIGN KEY ("groupMatchId") REFERENCES "SkillGroupMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationMatch" ADD CONSTRAINT "EducationMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "CandidateMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationMatch" ADD CONSTRAINT "EducationMatch_matchedEducationRecordId_fkey" FOREIGN KEY ("matchedEducationRecordId") REFERENCES "Education"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceMatch" ADD CONSTRAINT "ExperienceMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "CandidateMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityMatch" ADD CONSTRAINT "ResponsibilityMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "CandidateMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityMatch" ADD CONSTRAINT "ResponsibilityMatch_jobResponsibilityId_fkey" FOREIGN KEY ("jobResponsibilityId") REFERENCES "jobResponsibility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityEvidence" ADD CONSTRAINT "ResponsibilityEvidence_responsibilityMatchId_fkey" FOREIGN KEY ("responsibilityMatchId") REFERENCES "ResponsibilityMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityEvidence" ADD CONSTRAINT "ResponsibilityEvidence_pointEmbeddingId_fkey" FOREIGN KEY ("pointEmbeddingId") REFERENCES "CandidatePointEmbedding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
