-- AlterTable
ALTER TABLE "jobResponsibility" ADD COLUMN     "embedding" DOUBLE PRECISION[];

-- CreateTable
CREATE TABLE "CandidatePointEmbedding" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "candidateId" TEXT NOT NULL,
    "experienceId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "CandidatePointEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidatePointEmbedding_candidateId_idx" ON "CandidatePointEmbedding"("candidateId");

-- AddForeignKey
ALTER TABLE "CandidatePointEmbedding" ADD CONSTRAINT "CandidatePointEmbedding_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatePointEmbedding" ADD CONSTRAINT "CandidatePointEmbedding_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatePointEmbedding" ADD CONSTRAINT "CandidatePointEmbedding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
