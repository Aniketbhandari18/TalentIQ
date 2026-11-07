/*
  Warnings:

  - You are about to drop the column `jobResponsibility` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "points" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "jobResponsibility";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "points" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "jobResponsibility" (
    "id" TEXT NOT NULL,
    "responsibility" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "jobResponsibility_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "jobResponsibility" ADD CONSTRAINT "jobResponsibility_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
