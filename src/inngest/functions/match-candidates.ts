import fieldMapping from "@/data/field-to-field-mapping.json";
import { normalizeDegree } from "@/lib/degreeNormalizer";
import { normalizeFieldOfStudy } from "@/lib/fieldOfStudyNormalizer";
import { inngest } from "@/lib/inngest/client";
import prisma from "@/lib/prisma";
import { RANKING_CONFIG } from "@/lib/ranking/config";
import { mapEducation, matchEducationField } from "@/lib/ranking/education";
import {
  CandidateEducationInput,
  CandidatePointInput,
  CandidateSkillEvidence,
  CandidateSkillEvidenceSource,
  EvaluateCandidateMatchInput,
  JobEducationRequirementInput,
  JobSkillGroupInput,
  WorkExperienceInput,
} from "@/lib/ranking/types";
import { mapResponsibilities } from "@/lib/ranking/responsibility";
import { evaluateCandidateMatch } from "@/lib/ranking/evaluateCandidate";

const BATCH_SIZE = 10;

function isCurrentRole(endDate: string | null) {
  return !endDate || /present|current|now|ongoing/i.test(endDate);
}

export const matchCandidates = inngest.createFunction(
  {
    id: "match-candidates",
    triggers: { event: "job/match" },
  },
  async ({ event, step }) => {
    const { jobId } = event.data;

    const job = await step.run("load-job", async () => {
      const found = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          skillGroups: { include: { skills: true } },
          educationRequirement: { include: { acceptedDegrees: true } },
          JobResponsibilities: true,
        },
      });

      if (!found) throw new Error(`Job ${jobId} not found`);
      if (found.extractionStatus !== "COMPLETED") {
        throw new Error(
          `Job ${jobId} extraction is ${found.extractionStatus}, cannot match yet`,
        );
      }

      return found;
    });

    if (!job) {
      throw new Error("Active job not found for this recruiter");
    }

    const candidateIds = await step.run("load-candidate-ids", async () => {
      const candidates = await prisma.candidate.findMany({
        where: {
          uploadedById: job.createdById,
          // exclude candidates who already have a CandidateMatch for this job.
          candidateMatches: {
            none: {
              jobId,
            },
          },
        },
        select: { id: true },
      });
      return candidates.map((c) => c.id);
    });

    if (candidateIds.length === 0) {
      return { success: true, jobId, evaluated: 0, failed: 0 };
    }

    // 3. Prepare job-side inputs once (pure, cheap)
    const jobSkillGroups: JobSkillGroupInput[] = job.skillGroups.map((g) => ({
      id: g.id,
      category: g.category,
      requirementType: g.requirementType,
      requirements: g.skills.map((s) => ({
        id: s.id,
        name: s.name,
        normalizedName: s.normalizedName,
      })),
    }));

    const educationRequirement: JobEducationRequirementInput | null =
      job.educationRequirement
        ? {
            minEducationLevel: job.educationRequirement.minEducationLevel,
            acceptedDegrees: job.educationRequirement.acceptedDegrees.map(
              (d) => ({
                id: d.id,
                degreeName: d.degreeName,
                normalizedDegreeName: d.normalizedDegreeName,
                acceptedFieldOfStudy: d.acceptedFieldOfStudy,
                normalizedAcceptedFieldOfStudy:
                  d.normalizedAcceptedFieldOfStudy,
                isFieldOfStudyMandatory: d.isFieldOfStudyMandatory,
              }),
            ),
            relatedDegreesAllowed:
              job.educationRequirement.relatedDegreesAllowed,
            isMandatory: job.educationRequirement.isMandatory,
            relatedDegreeFieldsOfStudy:
              job.educationRequirement.relatedDegreeFieldsOfStudy,
            normalizedRelatedDegreeFieldsOfStudy:
              job.educationRequirement.normalizedRelatedDegreeFieldsOfStudy,
          }
        : null;

    let evaluated = 0;
    let failed = 0;

    for (let i = 0; i < candidateIds.length; i += BATCH_SIZE) {
      const batch = candidateIds.slice(i, i + BATCH_SIZE);

      const result = await step.run(
        `evaluate-batch-${i / BATCH_SIZE}`,
        async () => {
          const candidates = await prisma.candidate.findMany({
            where: { id: { in: batch } },
            include: {
              skillEvidence: true,
              projects: true,
              experience: true,
              education: true,
              candidatePointEmbeddings: {
                include: { experience: true, project: true },
              },
            },
          });

          console.log("Candidate IDs:", candidateIds.length);
          console.log("Batch size:", batch.length);
          console.log("Candidates fetched:", candidates.length);

          let ok = 0;
          let bad = 0;

          for (const candidate of candidates) {
            try {
              // ---- Skills ----------------------------------------------------
              // Every skill is treated as coming from the skills section
              const candidateSkillEvidence: CandidateSkillEvidence[] =
                candidate.skillEvidence.map((skill) => ({
                  skill: skill.skill,
                  normalizedSkill: skill.normalizedSkill,
                  source: skill.source as CandidateSkillEvidenceSource,
                  evidenceType: skill.evidenceType,
                  sourceTitle: skill.sourceTitle,
                  evidence: skill.evidence,
                  companyName: skill.companyName,
                }));

              // ---- Education -------------------------------------------------
              const candidateEducations: CandidateEducationInput[] =
                candidate.education.map((e) => ({
                  id: e.id,
                  degreeName: e.degree ?? "",
                  normalizedDegreeName: normalizeDegree(e.degree ?? ""),
                  fieldOfStudy: e.fieldOfStudy,
                  normalizedFieldOfStudy: e.fieldOfStudy
                    ? normalizeFieldOfStudy(e.fieldOfStudy)
                    : null,
                }));

              console.log("CANDIDATE EDUCATION:", candidateEducations);

              console.log(
                "ACCEPTED DEGREES:",
                educationRequirement?.acceptedDegrees,
              );

              console.log(
                "RELATED FIELD MATCH:",
                matchEducationField(
                  candidateEducations[0].normalizedFieldOfStudy!,
                  ["Computer Science", "IT"].map(normalizeFieldOfStudy),
                  fieldMapping,
                ),
              );

              console.log(
                "DEGREE COMPARISON:",
                educationRequirement?.acceptedDegrees.map((d) => ({
                  accepted: d.normalizedDegreeName,
                  candidate: candidateEducations[0].normalizedDegreeName,
                  matches:
                    d.normalizedDegreeName ===
                    candidateEducations[0].normalizedDegreeName,
                })),
              );

              const { levelRank } = RANKING_CONFIG.education;
              const candidateHighestEducationLevel =
                candidate.education
                  .map((e) => e.educationLevel as string)
                  .filter((level) => levelRank[level] !== undefined)
                  .sort((a, b) => levelRank[b] - levelRank[a])[0] ?? "OTHER";

              // ---- Experience ------------------------------------------------
              const experiences: WorkExperienceInput[] =
                candidate.experience.map((e) => ({
                  startDate: e.startDate,
                  endDate: e.endDate,
                  isCurrent: isCurrentRole(e.endDate),
                }));

              // ---- Responsibilities -----------------------------------------
              const candidatePoints: CandidatePointInput[] =
                candidate.candidatePointEmbeddings.map((p) => ({
                  id: p.id,
                  content: p.content,
                  embedding: p.embedding,
                  sourceType: p.experienceId ? "EXPERIENCE" : "PROJECT",
                  sourceTitle: p.experience
                    ? `Experience: ${p.experience.position} at ${p.experience.company}`
                    : p.project
                      ? `Project: ${p.project.title}`
                      : null,
                }));

              const matchInput: EvaluateCandidateMatchInput = {
                responsibilityInput: {
                  responsibilities: job.JobResponsibilities.map((r) => ({
                    id: r.id,
                    responsibility: r.responsibility,
                    embedding: r.embedding,
                    weight: r.weight,
                  })),
                  candidatePoints,
                },
                jobSkillGroups,
                candidateSkillEvidence,
                candidateEducations,
                candidateHighestEducationLevel,
                educationRequirement,
                fieldMapping: fieldMapping,
                experiences,
                requiredExperienceYears: job.minExperience,
              };

              // ---- Evaluate everything in one call --------------------------
              const match = evaluateCandidateMatch(matchInput);

              const skills = match.skillEvaluation;
              const education = match.educationEvaluation;
              const experience = match.experienceEvaluation;
              const responsibilities = match.responsibilityEvaluation;

              const totalYears = experience.totalExperienceMonths / 12;

              console.log("Saving match for candidate:", candidate.id);
              console.log("Match scores:", {
                overallScore: match.overallScore,
                skillScore: match.skillScore,
                educationScore: match.educationScore,
                experienceScore: match.experienceScore,
                responsibilityScore: match.responsibilityScore,
              });

              // ---- Persist (replace any previous match for this pair) -------
              await prisma.$transaction(async (tx) => {
                await tx.candidateMatch.deleteMany({
                  where: { jobId, candidateId: candidate.id },
                });

                await tx.candidateMatch.create({
                  data: {
                    jobId,
                    candidateId: candidate.id,
                    overallScore: match.overallScore,
                    skillScore: match.skillScore,
                    educationScore: match.educationScore,
                    experienceScore: match.experienceScore,
                    responsibilityScore: match.responsibilityScore,

                    skillGroups: {
                      create: skills.groups.map((g) => ({
                        category: g.category,
                        requirementType: g.requirementType,
                        score: g.score,
                        totalCount: g.totalSkills,
                        matchedCount: g.matchedSkills,
                        demonstratedCount: g.demonstratedSkills,
                        listedCount: g.listedSkills,
                        missingCount: g.missingSkills,
                        skillResults: {
                          create: g.requirements.map((r) => ({
                            name: r.name,
                            normalizedName: r.normalizedName,
                            evidenceType: r.evidenceType,
                            evidenceSource: r.evidenceSource,
                            credit: r.credit,
                            evidenceTitle: r.evidenceTitle,
                            evidence: r.evidence,
                            companyName: r.companyName,
                          })),
                        },
                      })),
                    },

                    ...(education && education.score !== null
                      ? {
                          educationEvaluation: {
                            create: {
                              ...mapEducation(education),
                              score: education.score,
                            },
                          },
                        }
                      : {}),

                    ...(experience.score !== null
                      ? {
                          experienceEvaluation: {
                            create: {
                              score: experience.score,
                              totalWorkExperience: totalYears,
                              meetsMinimumExperience:
                                job.minExperience === null
                                  ? null
                                  : totalYears >= job.minExperience,
                              meetsMaximumExperience:
                                job.maxExperience === null
                                  ? null
                                  : totalYears <= job.maxExperience,
                            },
                          },
                        }
                      : {}),

                    responsibilityMatches: {
                      create: mapResponsibilities(responsibilities),
                    },
                  },
                });
              });

              console.log("Match saved successfully:", candidate.id);

              const savedMatch = await prisma.candidateMatch.findUnique({
                where: {
                  jobId_candidateId: {
                    jobId,
                    candidateId: candidate.id,
                  },
                },
              });

              console.log("Saved match:", savedMatch);

              ok++;
            } catch (error) {
              console.error("CANDIDATE MATCH FAILED", {
                candidateId: candidate.id,
                jobId,
                error:
                  error instanceof Error
                    ? {
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                      }
                    : error,
              });

              bad++;
            }
          }

          return { ok, bad };
        },
      );

      evaluated += result.ok;
      failed += result.bad;
    }

    if (evaluated > 0) {
      await step.run("update-last-evaluated-at", async () => {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            lastEvaluatedAt: new Date(),
          },
        });
      });
    }

    return { jobId, evaluated, failed };
  },
);
