import taxonomy from "@/data/skill-taxonomy.json";

type ProficiencyLevel = {
  markers: string[];
  typical_experience: string;
};

type Skill = {
  id: string;
  canonical_name: string;
  aliases: string[];
  category: string;
  subcategory: string;
  tags: string[];
  description: string;
  parent_skills: string[];
  child_skills: string[];
  related_skills: string[];
  transferability: Record<string, number>;
  proficiency_levels: Record<string, ProficiencyLevel>;
  typical_roles: string[];
  industry_demand: string;
  prerequisites: string[];
};

const allSkills: Skill[] = Object.values(taxonomy.categories).flatMap(
  (category) =>
    Object.values(category.subcategories).flatMap(
      (subcategory) => subcategory.skills,
    ),
);

// Create a lookup map for canonical names and aliases
const skillMap = new Map<string, Skill>();

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

// Populate the lookup map
for (const skill of allSkills) {
  const names = [skill.canonical_name, ...skill.aliases];

  for (const name of names) {
    const key = normalizeKey(name);

    // Avoid overwriting existing mappings
    if (!skillMap.has(key)) {
      skillMap.set(key, skill);
    }
  }
}

// Find a skill using its canonical name or alias
export function findSkill(name: string): Skill | null {
  return skillMap.get(normalizeKey(name)) ?? null;
}

// Normalize a single skill
export function normalizeSkill(name: string): string {
  const skill = findSkill(name);

  return skill?.canonical_name ?? name.trim();
}

// Normalize multiple skills and remove duplicates
export function normalizeSkills(skills: string[]): string[] {
  return [...new Set(skills.map(normalizeSkill))];
}

// Get the complete list of skills
export function getAllSkills(): Skill[] {
  return allSkills;
}

// Get all skills belonging to a category
export function getSkillsByCategory(categoryName: string): Skill[] {
  return allSkills.filter((skill) => skill.subcategory === categoryName);
}
