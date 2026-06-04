import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, RotateCcw, Home } from "lucide-react";
import { useBuildamonster, CustomMonster } from "../state/store";
import { calculateDamage, getMonsterPower, recommendedOpponent } from "../engine/combat";

export default function BattleArena() {
  const navigate = useNavigate();
  const monsters = useBuildamonster((s) => s.monsters);
  const selectedMonster = useBuildamonster((s) => s.selectedMonster);
  const currentBattle = useBuildamonster((s) => s.currentBattle);
  const startBattle = useBuildamonster((s) => s.startBattle);
  const executeTurn = useBuildamonster((s) => s.executeTurn);
  const endBattle = useBuildamonster((s) => s.endBattle);
  const resetBattle = useBuildamonster((s) => s.resetBattle);

  const [opponent, setOpponent] = useState<CustomMonster | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  if (!selectedMonster) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-lg mb-4">No monster selected</p>
          <button
            onClick={() => navigate("/buildamonster")}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  const handleSelectOpponent = (opp: CustomMonster) => {
    setOpponent(opp);
    startBattle(selectedMonster, opp);
    setBattleLog([]);
  };

  const handleExecuteAction = (action: string) => {
    if (!currentBattle) return;

    executeTurn(action, 0);

    const battle = useBuildamonster.getState().currentBattle;
    if (battle) {
      const result = calculateDamage(battle.monsterA, battle.monsterB);
      setBattleLog((prev) => [...prev, result.message]);

      if (battle.winner) {
        setTimeout(() => {
          const winner = battle.winner === "A" ? battle.monsterA : battle.monsterB;
          endBattle(winner);
        }, 1500);
      }
    }
  };

  if (!currentBattle) {
    // Opponent selection screen
    const availableOpponents = monsters.filter((m) => m.id !== selectedMonster.id);
    const recommended = recommendedOpponent(selectedMonster, monsters);

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              ⚔️ Battle Arena
            </h1>
            <p className="text-purple-200">
              Select an opponent to battle {selectedMonster.name}!
            </p>
          </div>

          {/* Your Monster Card */}
          <div className="bg-gradient-to-r from-blue-600/50 to-cyan-600/50 border border-cyan-400/30 rounded-lg p-6 mb-8">
            <div className="text-5xl mb-3">{selectedMonster.parts.head?.sprite}</div>
            <h2 className="text-2xl font-bold text-white mb-2">{selectedMonster.name}</h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-sm text-cyan-200">HP</div>
                <div className="text-2xl font-bold text-red-400">{selectedMonster.baseStats.hp}</div>
              </div>
              <div>
                <div className="text-sm text-cyan-200">ATK</div>
                <div className="text-2xl font-bold text-orange-400">{selectedMonster.baseStats.attack}</div>
              </div>
              <div>
                <div className="text-sm text-cyan-200">DEF</div>
                <div className="text-2xl font-bold text-blue-400">{selectedMonster.baseStats.defense}</div>
              </div>
              <div>
                <div className="text-sm text-cyan-200">SPD</div>
                <div className="text-2xl font-bold text-yellow-400">{selectedMonster.baseStats.speed}</div>
              </div>
            </div>
          </div>

          {/* Opponents */}
          {availableOpponents.length === 0 ? (
            <div className="bg-purple-700/30 rounded-lg p-8 text-center">
              <p className="text-purple-200 text-lg">No opponents available</p>
              <p className="text-purple-400 mb-4">Create another monster to battle</p>
              <button
                onClick={() => navigate("/buildamonster")}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                Back to Hub
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Available Opponents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {availableOpponents.map((opp) => {
                  const isRecommended = recommended?.id === opp.id;
                  const powerA = getMonsterPower(selectedMonster);
                  const powerB = getMonsterPower(opp);
                  const matchupText =
                    powerB > powerA ? "⬆️ Stronger" : powerB < powerA ? "⬇️ Weaker" : "⚖️ Balanced";

                  return (
                    <button
                      key={opp.id}
                      onClick={() => handleSelectOpponent(opp)}
                      className={`p-6 rounded-lg text-left transition-all transform hover:scale-105 ${
                        isRecommended
                          ? "bg-gradient-to-r from-yellow-600/50 to-orange-600/50 border border-yellow-400/50"
                          : "bg-purple-700/40 border border-purple-400/30 hover:bg-purple-700/60"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-3xl mb-2">{opp.parts.head?.sprite}</div>
                          <h4 className="text-lg font-bold text-white">{opp.name}</h4>
                        </div>
                        {isRecommended && (
                          <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded">
                            Recommended
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-sm mb-3">
                        <div className="text-red-400 font-bold">{opp.baseStats.hp} HP</div>
                        <div className="text-orange-400 font-bold">{opp.baseStats.attack} ATK</div>
                        <div className="text-blue-400 font-bold">{opp.baseStats.defense} DEF</div>
                        <div className="text-yellow-400 font-bold">{opp.baseStats.speed} SPD</div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-purple-300">Lvl {opp.level}</span>
                        <span className="text-purple-300">{matchupText}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => navigate("/buildamonster")}
            className="w-full bg-purple-700/50 hover:bg-purple-600/50 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} /> Back to Hub
          </button>
        </div>
      </div>
    );
  }

  // Battle in progress screen
  const { monsterA, monsterB, hpA, hpB, winner } = currentBattle;
  const hpPercentA = (hpA / monsterA.baseStats.hp) * 100;
  const hpPercentB = (hpB / monsterB.baseStats.hp) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-purple-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Battle Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
          ⚔️ BATTLE IN PROGRESS ⚔️
        </h1>

        {/* Battle Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Player A */}
          <div className="bg-gradient-to-b from-blue-600/50 to-blue-800/50 border-2 border-blue-400/50 rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="text-6xl mb-3">{monsterA.parts.head?.sprite}</div>
              <h2 className="text-2xl font-bold text-white">{monsterA.name}</h2>
              <p className="text-blue-200">Lvl {monsterA.level}</p>
            </div>

            {/* HP Bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-blue-200 font-bold">HP</span>
                <span className="text-blue-100">{Math.max(0, hpA)} / {monsterA.baseStats.hp}</span>
              </div>
              <div className="w-full h-6 bg-black/40 rounded-full border border-blue-400/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, hpPercentA)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="bg-black/30 rounded p-2">
                <div className="text-blue-300">ATK</div>
                <div className="text-blue-100 font-bold">{monsterA.baseStats.attack}</div>
              </div>
              <div className="bg-black/30 rounded p-2">
                <div className="text-blue-300">DEF</div>
                <div className="text-blue-100 font-bold">{monsterA.baseStats.defense}</div>
              </div>
              <div className="bg-black/30 rounded p-2">
                <div className="text-blue-300">SPD</div>
                <div className="text-blue-100 font-bold">{monsterA.baseStats.speed}</div>
              </div>
              <div className="bg-black/30 rounded p-2">
                <div className="text-blue-300">EXP</div>
                <div className="text-blue-100 font-bold">{monsterA.experience}</div>
              </div>
            </div>
          </div>

          {/* Player B */}
          <div className="bg-gradient-to-b from-red-600/50 to-red-800/50 border-2 border-red-400/50 rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="text-6xl mb-3">{monsterB.parts.head?.sprite}</div>
              <h2 className="text-2xl font-bold text-white">{monsterB.name}</h2>
              <p className="text-red-200">Lvl {monsterB.level}</p>
            </div>

            {/* HP Bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-red-200 font-bold">HP</span>
                <span className="text-red-100">{Math.max(0, hpB)} / {monsterB.baseStats.hp}</span>
              </div>
              <div className="w-full h-6 bg-black/40 rounded-full border border-red-400/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, hpPercentB)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="bg-black/30 rounded p-2">
                <div className="text-red-300">ATK</div>
                <div className="text-red-100 font-bold">{monsterB.baseStats.attack}</div>
              </div>
              <div className="bg-black/30 rounded p-2">
                <div className="text-red-300">DEF</div>
                <div className="text-red-100 font-bold">{monsterB.baseStats.defense}</div>
              </div>
              <div className="bg-black/30 rounded p-2">
                <div className="text-red-300">SPD</div>
                <div className="text-red-100 font-bold">{monsterB.baseStats.speed}</div>
              </div>
              <div className="bg-black/30 rounded p-2">
                <div className="text-red-300">EXP</div>
                <div className="text-red-100 font-bold">{monsterB.experience}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="bg-black/50 border border-purple-400/30 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
          <div className="space-y-2">
            {battleLog.length === 0 ? (
              <p className="text-purple-300 text-center">Battle begins...</p>
            ) : (
              battleLog.map((log, idx) => (
                <p key={idx} className="text-purple-200 text-sm animate-pulse">
                  → {log}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Battle Controls */}
        {!winner ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleExecuteAction("Attack")}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Zap size={20} /> Attack
            </button>
            <button
              onClick={() => handleExecuteAction("Defend")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              🛡️ Defend
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-600/50 to-orange-600/50 border border-yellow-400/50 rounded-lg p-6 mb-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">🎉 Battle Complete! 🎉</h2>
            <p className="text-yellow-100 text-xl mb-4">
              {winner === "A" ? monsterA.name : monsterB.name} wins!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetBattle();
                  navigate("/buildamonster");
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  resetBattle();
                  handleSelectOpponent(monsterB);
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} /> Rematch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
