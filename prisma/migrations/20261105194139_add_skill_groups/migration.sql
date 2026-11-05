/*
  Warnings:

  - You are about to drop the column `jobId` on the `SkillRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `mustHave` on the `SkillRequirement` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[groupId,normalizedName]` on the table `SkillRequirement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `groupId` to the `SkillRequirement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SkillGroupType" AS ENUM ('ANY', 'ALL', 'PREFERRED');

-- DropForeignKey
ALTER TABLE "SkillRequirement" DROP CONSTRAINT "SkillRequirement_jobId_fkey";

-- DropIndex
DROP INDEX "SkillRequirement_jobId_normalizedName_key";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "maxExperience" INTEGER;

-- AlterTable
ALTER TABLE "SkillRequirement" DROP COLUMN "jobId",
DROP COLUMN "mustHave",
ADD COLUMN     "groupId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SkillGroup" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requirementType" "SkillGroupType" NOT NULL DEFAULT 'ANY',
    "jobId" TEXT NOT NULL,

    CONSTRAINT "SkillGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillGroup_jobId_idx" ON "SkillGroup"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillRequirement_groupId_normalizedName_key" ON "SkillRequirement"("groupId", "normalizedName");

-- AddForeignKey
ALTER TABLE "SkillGroup" ADD CONSTRAINT "SkillGroup_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillRequirement" ADD CONSTRAINT "SkillRequirement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SkillGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
