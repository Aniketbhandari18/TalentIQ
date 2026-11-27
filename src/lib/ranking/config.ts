/**
 * Central configuration for the ranking engine.
 * Every constant that influences a score lives here so tuning never requires
 * touching scoring logic. The whole object is snapshotted into RankingRun.config.
 */

export const RANKING_CONFIG = {
  /** Base weights of each dimension in the overall score (rescaled if a dimension is N/A). */
  weights: {
    responsibilities: 0.4,
    skills: 0.3,
    experience: 0.15,
    education: 0.15,
  },

  /** If the job marks education as non-mandatory its weight is multiplied by this. */
  optionalEducationWeightFactor: 0.5,

  skills: {
    requiredPool: 70,
    preferredPool: 30,
    /** Preferred credit is multiplied by (floor + (1 - floor) * R). */
    foundationFloor: 0.5,
    listedOnlyCredit: 0.8, // listed in the skills section but never shown in a project / role
    inferredCredit: 0.9,
    explicitCredit: 1.0,
    // demonstratedCredit: 1.0,

    anyFirstMatchShare: 0.9,
    anyMaxExtras: 2,
    groupWeight: { ALL: 1.0, ANY: 1.0, PREFERRED: 1.0 },
  },

  education: {
    levelPoints: 25,
    degreePoints: 75,
    levelRank: {
      OTHER: 0,
      SECONDARY: 1,
      HIGHER_SECONDARY: 2,
      DIPLOMA: 3,
      ASSOCIATE: 3,
      UNDERGRADUATE: 4,
      POSTGRADUATE: 5,
      DOCTORATE: 6,
    } as Record<string, number>,
    credit: {
      // acceptedDegreeFieldOk: 1.0,
      // relatedDegreeAndField: 0.6,
      // acceptedDegreeWrongFieldOptional: 0.5,
      // wrongDegreeButAcceptedField: 0.35,
      // acceptedDegreeWrongFieldMandatory: 0.25,
      acceptedDegreeFieldOk: 1.0,
      acceptedDegreeAndRelatedField: 0.6,
      acceptedDegreeWrongFieldOptional: 0.5,
      acceptedDegreeWrongFieldMandatory: 0.25,

      alternativeDegree: {
        mandatory: {
          allowed: {
            exact: 0.6,
            related: 0.4,
          },
          notAllowed: {
            exact: 0.35,
            related: 0.2,
          },
        },
        optional: {
          allowed: {
            exact: 0.8,
            related: 0.6,
          },
          notAllowed: {
            exact: 0.6,
            related: 0.4,
          },
        },
      },
    },
  },

  experience: {
    /** Share of the experience score that depends on total years vs. relevant years. */
    totalWorkExperience: 1.0, // This is temprorarily 1, will consider this later
    relevantWorkExperience: 0, // This is temprorarily 0, will consider this later
    // belowMinExponent: 1.5,
    /** A role counts as "relevant" when its best calibrated similarity is at least this. */
    // relevantThreshold: 0.4,
    yearOnlyMonth: 6, // "2021" is treated as 1 July 2021 (0-based month index)
  },

  responsibilities: {
    /** Cosine -> [0,1]: <= low -> 0, >= high -> 1. Calibrate with calibrate-similarity.ts. */
    // calibration: { low: 0.55, high: 0.85 },
    // bestShare: 0.75,
    // supportShare: 0.25,
    // supportCount: 2,
    // reuse: { step: 0.2, floor: 0.2 },
    // levels: { strong: 0.75, partial: 0.4 },
    levels: {
      strong: 0.85,
      partial: 0.7,
      weak: 0.4,
    },
    maxEvidence: 2,
  },

  // batchSize: 30,
} as const;
