import { CustomMonster } from "../state/store";

export interface CombatResult {
  damage: number;
  dodged: boolean;
  critical: boolean;
  message: string;
}

export interface CombatState {
  attacker: CustomMonster;
  defender: CustomMonster;
  currentHP: { attacker: number; defender: number };
  turn: number;
}

export function calculateDamage(attacker: CustomMonster, defender: CustomMonster): CombatResult {
  const baseAttack = attacker.baseStats.attack;
  const defenseReduction = defender.baseStats.defense * 0.3;
  const variance = 0.8 + Math.random() * 0.4;
  const baseDamage = baseAttack * variance;
  const finalDamage = Math.max(1, baseDamage - defenseReduction);

  // Dodge calculation based on speed
  const dodgeChance = defender.baseStats.speed / (defender.baseStats.speed + attacker.baseStats.attack);
  const dodged = Math.random() < dodgeChance;

  // Critical hit chance based on level
  const critChance = (attacker.level * 0.05) + 0.05; // 5-25% crit chance
  const critical = !dodged && Math.random() < critChance;

  const damage = dodged ? 0 : (critical ? Math.floor(finalDamage * 1.5) : Math.floor(finalDamage));

  let message = "";
  if (dodged) {
    message = `${defender.name} dodges the attack!`;
  } else if (critical) {
    message = `${attacker.name} lands a critical hit!`;
  } else {
    message = `${attacker.name} attacks ${defender.name}!`;
  }

  return {
    damage,
    dodged,
    critical,
    message,
  };
}

export function levelUpMonster(monster: CustomMonster): CustomMonster {
  const nextLevelXP = 100 * Math.pow(1.1, monster.level);
  
  if (monster.experience >= nextLevelXP) {
    const newMonster = { ...monster };
    newMonster.level += 1;
    newMonster.experience -= Math.floor(nextLevelXP);
    
    // Stat gains on level up (scaling with level)
    const levelMultiplier = 1 + (newMonster.level * 0.05);
    newMonster.baseStats.hp = Math.floor(newMonster.baseStats.hp * levelMultiplier);
    newMonster.baseStats.attack = Math.floor(newMonster.baseStats.attack * levelMultiplier);
    newMonster.baseStats.defense = Math.floor(newMonster.baseStats.defense * levelMultiplier);
    newMonster.baseStats.speed = Math.floor(newMonster.baseStats.speed * levelMultiplier);
    
    return newMonster;
  }
  
  return monster;
}

export function getMonsterStats(monster: CustomMonster) {
  const totalBattles = monster.wins + monster.losses;
  const winRate = totalBattles > 0 ? ((monster.wins / totalBattles) * 100).toFixed(1) : "0.0";
  const nextLevelXP = 100 * Math.pow(1.1, monster.level);
  const xpProgress = (monster.experience / nextLevelXP) * 100;

  return {
    totalBattles,
    winRate: parseFloat(winRate),
    xpProgress,
    nextLevelXP: Math.floor(nextLevelXP),
    currentXP: monster.experience,
  };
}

export function getMonsterPower(monster: CustomMonster): number {
  const stats = monster.baseStats;
  const power = (stats.hp + stats.attack + stats.defense + stats.speed) * (1 + monster.level * 0.1);
  return Math.floor(power);
}

export function recommendedOpponent(myMonster: CustomMonster, allMonsters: CustomMonster[]): CustomMonster | null {
  const myPower = getMonsterPower(myMonster);
  const candidates = allMonsters.filter(m => m.id !== myMonster.id);
  
  if (candidates.length === 0) return null;

  // Find opponent closest to our power level (±20%)
  const target = myPower;
  const tolerance = myPower * 0.2;

  let best = candidates[0];
  let bestDiff = Math.abs(getMonsterPower(best) - target);

  for (const candidate of candidates) {
    const candidatePower = getMonsterPower(candidate);
    const diff = Math.abs(candidatePower - target);
    
    if (diff < tolerance && diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }

  return best;
}
