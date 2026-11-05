-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "JobExtractionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EducationLevel" ADD VALUE 'DIPLOMA';
ALTER TYPE "EducationLevel" ADD VALUE 'ASSOCIATE';

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minExperience" INTEGER,
    "location" TEXT,
    "jobResponsibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "extractionStatus" "JobExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "extractionError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillRequirement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "mustHave" BOOLEAN NOT NULL,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "SkillRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationRequirement" (
    "id" TEXT NOT NULL,
    "minEducationLevel" "EducationLevel",
    "relatedDegreesAllowed" BOOLEAN NOT NULL DEFAULT false,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "relatedDegreeFieldsOfStudy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jobId" TEXT NOT NULL,

    CONSTRAINT "EducationRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcceptedDegree" (
    "id" TEXT NOT NULL,
    "degreeName" TEXT NOT NULL,
    "normalizedDegreeName" TEXT NOT NULL,
    "acceptedFieldOfStudy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFieldOfStudyMandatory" BOOLEAN NOT NULL DEFAULT false,
    "educationRequirementId" TEXT NOT NULL,

    CONSTRAINT "AcceptedDegree_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_createdById_idx" ON "Job"("createdById");

-- CreateIndex
CREATE INDEX "SkillRequirement_normalizedName_idx" ON "SkillRequirement"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "SkillRequirement_jobId_normalizedName_key" ON "SkillRequirement"("jobId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "EducationRequirement_jobId_key" ON "EducationRequirement"("jobId");

-- CreateIndex
CREATE INDEX "AcceptedDegree_normalizedDegreeName_idx" ON "AcceptedDegree"("normalizedDegreeName");

-- CreateIndex
CREATE UNIQUE INDEX "AcceptedDegree_educationRequirementId_normalizedDegreeName_key" ON "AcceptedDegree"("educationRequirementId", "normalizedDegreeName");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillRequirement" ADD CONSTRAINT "SkillRequirement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationRequirement" ADD CONSTRAINT "EducationRequirement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptedDegree" ADD CONSTRAINT "AcceptedDegree_educationRequirementId_fkey" FOREIGN KEY ("educationRequirementId") REFERENCES "EducationRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
