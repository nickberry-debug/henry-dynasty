import { MonsterPart } from "../state/store";

export const MONSTER_PART_LIBRARY: Record<string, MonsterPart[]> = {
  head: [
    {
      id: "head-dragon",
      name: "Dragon Head",
      type: "head",
      sprite: "🐉",
      color: "#D4AF37",
      stats: { hp: 20, attack: 15, defense: 10, speed: 8 },
    },
    {
      id: "head-cat",
      name: "Cat Head",
      type: "head",
      sprite: "🐱",
      color: "#FFA500",
      stats: { hp: 15, attack: 12, defense: 8, speed: 16 },
    },
    {
      id: "head-bear",
      name: "Bear Head",
      type: "head",
      sprite: "🐻",
      color: "#8B4513",
      stats: { hp: 25, attack: 18, defense: 14, speed: 6 },
    },
    {
      id: "head-rabbit",
      name: "Rabbit Head",
      type: "head",
      sprite: "🐰",
      color: "#FFB6C1",
      stats: { hp: 10, attack: 8, defense: 5, speed: 18 },
    },
    {
      id: "head-robot",
      name: "Robot Head",
      type: "head",
      sprite: "🤖",
      color: "#C0C0C0",
      stats: { hp: 18, attack: 14, defense: 16, speed: 10 },
    },
    {
      id: "head-ghost",
      name: "Ghost Head",
      type: "head",
      sprite: "👻",
      color: "#FFFFFF",
      stats: { hp: 12, attack: 10, defense: 6, speed: 14 },
    },
  ],
  body: [
    {
      id: "body-strong",
      name: "Strong Torso",
      type: "body",
      sprite: "💪",
      color: "#FF6B6B",
      stats: { hp: 15, attack: 10, defense: 8, speed: 3 },
    },
    {
      id: "body-agile",
      name: "Agile Torso",
      type: "body",
      sprite: "🏃",
      color: "#4ECDC4",
      stats: { hp: 10, attack: 8, defense: 5, speed: 12 },
    },
    {
      id: "body-tank",
      name: "Armored Torso",
      type: "body",
      sprite: "🛡️",
      color: "#2C3E50",
      stats: { hp: 20, attack: 6, defense: 14, speed: 2 },
    },
    {
      id: "body-mystical",
      name: "Mystical Torso",
      type: "body",
      sprite: "✨",
      color: "#9B59B6",
      stats: { hp: 12, attack: 12, defense: 7, speed: 10 },
    },
    {
      id: "body-electric",
      name: "Electric Torso",
      type: "body",
      sprite: "⚡",
      color: "#F1C40F",
      stats: { hp: 13, attack: 13, defense: 6, speed: 11 },
    },
    {
      id: "body-icy",
      name: "Icy Torso",
      type: "body",
      sprite: "❄️",
      color: "#3498DB",
      stats: { hp: 14, attack: 10, defense: 10, speed: 9 },
    },
  ],
  legs: [
    {
      id: "legs-runner",
      name: "Runner Legs",
      type: "legs",
      sprite: "🦵",
      color: "#E74C3C",
      stats: { hp: 8, attack: 3, defense: 2, speed: 15 },
    },
    {
      id: "legs-heavy",
      name: "Heavy Legs",
      type: "legs",
      sprite: "🦶",
      color: "#34495E",
      stats: { hp: 12, attack: 2, defense: 10, speed: 1 },
    },
    {
      id: "legs-balanced",
      name: "Balanced Legs",
      type: "legs",
      sprite: "🧗",
      color: "#16A085",
      stats: { hp: 10, attack: 4, defense: 6, speed: 8 },
    },
    {
      id: "legs-spring",
      name: "Spring Legs",
      type: "legs",
      sprite: "🦘",
      color: "#D35400",
      stats: { hp: 9, attack: 5, defense: 3, speed: 13 },
    },
  ],
  accessory: [
    {
      id: "acc-crown",
      name: "Crown",
      type: "accessory",
      sprite: "👑",
      color: "#FFD700",
      stats: { hp: 5, attack: 0, defense: 3, speed: 0 },
    },
    {
      id: "acc-sword",
      name: "Sword",
      type: "accessory",
      sprite: "⚔️",
      color: "#DCDCDC",
      stats: { hp: 0, attack: 8, defense: 0, speed: 0 },
    },
    {
      id: "acc-shield",
      name: "Shield",
      type: "accessory",
      sprite: "🛡️",
      color: "#8B0000",
      stats: { hp: 3, attack: 0, defense: 8, speed: -2 },
    },
    {
      id: "acc-cloak",
      name: "Cloak",
      type: "accessory",
      sprite: "🧥",
      color: "#4B0082",
      stats: { hp: 2, attack: 2, defense: 4, speed: 2 },
    },
    {
      id: "acc-wings",
      name: "Wings",
      type: "accessory",
      sprite: "🦅",
      color: "#8B7355",
      stats: { hp: 1, attack: 3, defense: 1, speed: 10 },
    },
    {
      id: "acc-tail",
      name: "Tail",
      type: "accessory",
      sprite: "🐍",
      color: "#228B22",
      stats: { hp: 2, attack: 4, defense: 2, speed: 3 },
    },
  ],
};

export function getPartsByType(type: "head" | "body" | "legs" | "accessory"): MonsterPart[] {
  return MONSTER_PART_LIBRARY[type] || [];
}

export function calculateCombinedStats(parts: {
  head: MonsterPart | null;
  body: MonsterPart | null;
  legs: MonsterPart | null;
  accessories: MonsterPart[];
}) {
  let combined = { hp: 50, attack: 50, defense: 50, speed: 50 }; // Base stats

  if (parts.head) {
    combined.hp += parts.head.stats.hp;
    combined.attack += parts.head.stats.attack;
    combined.defense += parts.head.stats.defense;
    combined.speed += parts.head.stats.speed;
  }

  if (parts.body) {
    combined.hp += parts.body.stats.hp;
    combined.attack += parts.body.stats.attack;
    combined.defense += parts.body.stats.defense;
    combined.speed += parts.body.stats.speed;
  }

  if (parts.legs) {
    combined.hp += parts.legs.stats.hp;
    combined.attack += parts.legs.stats.attack;
    combined.defense += parts.legs.stats.defense;
    combined.speed += parts.legs.stats.speed;
  }

  for (const accessory of parts.accessories) {
    combined.hp += accessory.stats.hp;
    combined.attack += accessory.stats.attack;
    combined.defense += accessory.stats.defense;
    combined.speed += accessory.stats.speed;
  }

  // Ensure minimum stats
  combined.hp = Math.max(30, combined.hp);
  combined.attack = Math.max(30, combined.attack);
  combined.defense = Math.max(30, combined.defense);
  combined.speed = Math.max(30, combined.speed);

  return combined;
}
