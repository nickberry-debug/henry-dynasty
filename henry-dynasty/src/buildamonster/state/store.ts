import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface MonsterPart {
  id: string;
  name: string;
  type: "head" | "body" | "legs" | "accessory";
  sprite: string;
  color: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
}

export interface CustomMonster {
  id: string;
  name: string;
  createdAt: number;
  parts: {
    head: MonsterPart | null;
    body: MonsterPart | null;
    legs: MonsterPart | null;
    accessories: MonsterPart[];
  };
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  wins: number;
  losses: number;
  level: number;
  experience: number;
}

export interface BattleLog {
  id: string;
  monsterAId: string;
  monsterBId: string;
  winner: string;
  timestamp: number;
  turns: Array<{
    turn: number;
    attacker: string;
    action: string;
    damage: number;
    dodged: boolean;
  }>;
}

interface BuildamonsterStore {
  monsters: CustomMonster[];
  selectedMonster: CustomMonster | null;
  currentBattle: {
    monsterA: CustomMonster;
    monsterB: CustomMonster;
    currentTurn: "A" | "B";
    hpA: number;
    hpB: number;
    turnCount: number;
    battleLog: BattleLog["turns"];
    winner: string | null;
  } | null;
  battleHistory: BattleLog[];
  
  // Actions
  createMonster: (monster: CustomMonster) => void;
  deleteMonster: (id: string) => void;
  selectMonster: (monster: CustomMonster | null) => void;
  updateMonster: (id: string, updates: Partial<CustomMonster>) => void;
  startBattle: (monsterA: CustomMonster, monsterB: CustomMonster) => void;
  executeTurn: (action: string, targetIndex: number) => void;
  endBattle: (winner: CustomMonster) => void;
  resetBattle: () => void;
  getBattleStats: () => { totalBattles: number; wins: number; losses: number };
}

export const useBuildamonster = create<BuildamonsterStore>()(
  immer((set, get) => ({
    monsters: [],
    selectedMonster: null,
    currentBattle: null,
    battleHistory: [],

    createMonster: (monster) =>
      set((state) => {
        state.monsters.push(monster);
      }),

    deleteMonster: (id) =>
      set((state) => {
        state.monsters = state.monsters.filter((m) => m.id !== id);
      }),

    selectMonster: (monster) =>
      set({ selectedMonster: monster }),

    updateMonster: (id, updates) =>
      set((state) => {
        const idx = state.monsters.findIndex((m) => m.id === id);
        if (idx !== -1) {
          state.monsters[idx] = { ...state.monsters[idx], ...updates };
        }
      }),

    startBattle: (monsterA, monsterB) =>
      set({
        currentBattle: {
          monsterA,
          monsterB,
          currentTurn: "A",
          hpA: monsterA.baseStats.hp,
          hpB: monsterB.baseStats.hp,
          turnCount: 0,
          battleLog: [],
          winner: null,
        },
      }),

    executeTurn: (action, targetIndex) =>
      set((state) => {
        if (!state.currentBattle) return;

        const { currentTurn, monsterA, monsterB } = state.currentBattle;
        const attacker = currentTurn === "A" ? monsterA : monsterB;
        const defender = currentTurn === "A" ? monsterB : monsterA;

        // Simple combat calculation
        const baseDamage = attacker.baseStats.attack * (0.8 + Math.random() * 0.4);
        const actualDamage = Math.max(0, baseDamage - defender.baseStats.defense * 0.3);
        const dodgeChance = defender.baseStats.speed / (defender.baseStats.speed + attacker.baseStats.speed);
        const dodged = Math.random() < dodgeChance;

        if (currentTurn === "A") {
          state.currentBattle.hpB = Math.max(0, state.currentBattle.hpB - (dodged ? 0 : actualDamage));
        } else {
          state.currentBattle.hpA = Math.max(0, state.currentBattle.hpA - (dodged ? 0 : actualDamage));
        }

        state.currentBattle.battleLog.push({
          turn: state.currentBattle.turnCount,
          attacker: currentTurn,
          action,
          damage: dodged ? 0 : Math.floor(actualDamage),
          dodged,
        });

        // Check for winner
        if (state.currentBattle.hpB <= 0) {
          state.currentBattle.winner = "A";
        } else if (state.currentBattle.hpA <= 0) {
          state.currentBattle.winner = "B";
        } else {
          state.currentBattle.currentTurn = currentTurn === "A" ? "B" : "A";
          state.currentBattle.turnCount += 1;
        }
      }),

    endBattle: (winner) =>
      set((state) => {
        if (!state.currentBattle) return;

        const battleLog: BattleLog = {
          id: `battle-${Date.now()}`,
          monsterAId: state.currentBattle.monsterA.id,
          monsterBId: state.currentBattle.monsterB.id,
          winner: winner.id,
          timestamp: Date.now(),
          turns: state.currentBattle.battleLog,
        };

        state.battleHistory.push(battleLog);

        // Update monster stats
        const winnerIdx = state.monsters.findIndex((m) => m.id === winner.id);
        if (winnerIdx !== -1) {
          state.monsters[winnerIdx].wins += 1;
          state.monsters[winnerIdx].experience += 50;
        }

        const loserId = state.currentBattle.monsterA.id === winner.id
          ? state.currentBattle.monsterB.id
          : state.currentBattle.monsterA.id;
        const loserIdx = state.monsters.findIndex((m) => m.id === loserId);
        if (loserIdx !== -1) {
          state.monsters[loserIdx].losses += 1;
          state.monsters[loserIdx].experience += 20;
        }
      }),

    resetBattle: () =>
      set({ currentBattle: null }),

    getBattleStats: () => {
      const { battleHistory } = get();
      return {
        totalBattles: battleHistory.length,
        wins: battleHistory.filter((b) => b.winner).length,
        losses: battleHistory.length - battleHistory.filter((b) => b.winner).length,
      };
    },
  }))
);
