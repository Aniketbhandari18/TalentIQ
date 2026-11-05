import degreeData from "@/data/degree-aliases.json";

const degreeMap = new Map(
  Object.entries(degreeData).map(([key, value]) => [normalizeKey(key), value]),
);

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeDegree(degree: string) {
  if (typeof degree !== "string" || !degree.trim()) {
    return degree;
  }

  return degreeMap.get(normalizeKey(degree)) ?? degree.trim();
}
