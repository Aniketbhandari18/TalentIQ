-- AlterTable
ALTER TABLE "AcceptedDegree" ADD COLUMN     "normalizedAcceptedFieldOfStudy" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "EducationRequirement" ADD COLUMN     "normalizedRelatedDegreeFieldsOfStudy" TEXT[] DEFAULT ARRAY[]::TEXT[];
