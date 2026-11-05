import fieldOfStudyData from "@/data/field-of-study-aliases.json";

const degreeMap = new Map(
  Object.entries(fieldOfStudyData).map(([key, value]) => [
    normalizeKey(key),
    value,
  ]),
);

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeFieldOfStudy(degree: string) {
  if (typeof degree !== "string" || !degree.trim()) {
    return degree;
  }

  return degreeMap.get(normalizeKey(degree)) ?? degree.trim();
}

export function normalizeFieldsOfStudy(fields: string[]) {
  return fields.map(normalizeFieldOfStudy);
}
