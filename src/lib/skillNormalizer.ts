import skillData from "@/data/degree-aliases.json";

const skillMap = new Map(
  Object.entries(skillData).map(([key, value]) => [normalizeKey(key), value]),
);

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeSkill(skill: string) {
  if (typeof skill !== "string" || !skill.trim()) {
    return skill;
  }

  return skillMap.get(normalizeKey(skill)) ?? skill.trim();
}

export function normalizeSkills(fields: string[]) {
  return fields.map(normalizeSkill);
}
