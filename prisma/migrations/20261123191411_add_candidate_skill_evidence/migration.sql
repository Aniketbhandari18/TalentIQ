
-- CreateEnum
CREATE TYPE "SkillEvidenceType" AS ENUM ('LISTED', 'EXPLICIT', 'INFERRED');

-- AlterEnum
BEGIN;
CREATE TYPE "SkillEvidenceSource_new" AS ENUM ('SKILLS_SECTION', 'PROJECT', 'WORK_EXPERIENCE', 'NONE');

ALTER TABLE "public"."SkillRequirementMatch"
ALTER COLUMN "evidenceSource" DROP DEFAULT;

ALTER TABLE "SkillRequirementMatch"
ALTER COLUMN "evidenceSource" TYPE "SkillEvidenceSource_new"
USING ("evidenceSource"::text::"SkillEvidenceSource_new");

ALTER TYPE "SkillEvidenceSource" RENAME TO "SkillEvidenceSource_old";
ALTER TYPE "SkillEvidenceSource_new" RENAME TO "SkillEvidenceSource";

DROP TYPE "public"."SkillEvidenceSource_old";

ALTER TABLE "SkillRequirementMatch"
ALTER COLUMN "evidenceSource" SET DEFAULT 'NONE';

COMMIT;

-- AlterTable
ALTER TABLE "SkillRequirementMatch"
DROP COLUMN "status",
ADD COLUMN "evidence" TEXT,
ADD COLUMN "evidenceType" "SkillEvidenceType";

-- DropEnum
DROP TYPE "SkillMatchStatus";

-- CreateTable
CREATE TABLE "CandidateSkillEvidence" (
    "id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "normalizedSkill" TEXT NOT NULL,
    "source" "SkillEvidenceSource" NOT NULL,
    "evidenceType" "SkillEvidenceType" NOT NULL,
    "sourceTitle" TEXT,
    "evidence" TEXT,
    "companyName" TEXT,
    "candidateId" TEXT NOT NULL,

    CONSTRAINT "CandidateSkillEvidence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CandidateSkillEvidence"
ADD CONSTRAINT "CandidateSkillEvidence_candidateId_fkey"
FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
