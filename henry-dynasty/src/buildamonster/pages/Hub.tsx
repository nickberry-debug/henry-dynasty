import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Zap } from "lucide-react";
import { useBuildamonster } from "../state/store";

export default function BuildamonsterHub() {
  const navigate = useNavigate();
  const [showNewHint, setShowNewHint] = useState(false);
  const monsters = useBuildamonster((s) => s.monsters);
  const selectMonster = useBuildamonster((s) => s.selectMonster);

  const stats = {
    totalMonsters: monsters.length,
    totalBattles: monsters.reduce((sum, m) => sum + m.wins + m.losses, 0),
    totalWins: monsters.reduce((sum, m) => sum + m.wins, 0),
  };

  const handleCreateNew = () => {
    selectMonster(null);
    navigate("/buildamonster/create");
  };

  const handleSelectMonster = (id: string) => {
    const monster = monsters.find((m) => m.id === id);
    if (monster) {
      selectMonster(monster);
      navigate("/buildamonster/battle");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          🧟 Build-a-Monster Battle
        </h1>
        <p className="text-purple-200 text-lg">Create custom monsters and battle them!</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 max-w-2xl mx-auto">
        <div className="bg-purple-700/50 backdrop-blur border border-purple-400/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-100">{stats.totalMonsters}</div>
          <div className="text-sm text-purple-300">Monsters Created</div>
        </div>
        <div className="bg-purple-700/50 backdrop-blur border border-purple-400/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-100">{stats.totalBattles}</div>
          <div className="text-sm text-purple-300">Total Battles</div>
        </div>
        <div className="bg-purple-700/50 backdrop-blur border border-purple-400/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.totalWins}</div>
          <div className="text-sm text-purple-300">Victories</div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mb-12">
        <button
          onClick={handleCreateNew}
          onMouseEnter={() => setShowNewHint(true)}
          onMouseLeave={() => setShowNewHint(false)}
          className="flex-1 relative bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Plus size={20} />
          Create Monster
        </button>
        <button
          onClick={() => navigate("/buildamonster/gallery")}
          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Play size={20} />
          Arena
        </button>
      </div>

      {/* Monsters List */}
      {monsters.length === 0 ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-purple-700/30 backdrop-blur border border-purple-400/20 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">👻</div>
            <p className="text-purple-200 text-lg">No monsters yet!</p>
            <p className="text-purple-300 mb-4">Create your first monster to get started</p>
            <button
              onClick={handleCreateNew}
              className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Create Now
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Your Monsters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monsters.map((monster) => {
              const winRate =
                monster.wins + monster.losses > 0
                  ? ((monster.wins / (monster.wins + monster.losses)) * 100).toFixed(0)
                  : "0";

              return (
                <div
                  key={monster.id}
                  onClick={() => handleSelectMonster(monster.id)}
                  className="bg-purple-700/40 backdrop-blur border border-purple-400/30 rounded-lg p-4 cursor-pointer hover:bg-purple-700/60 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-3xl mb-2">
                    {monster.parts.head?.sprite || "🧟"}
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{monster.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <div className="text-purple-300">Level</div>
                      <div className="text-white font-bold">{monster.level}</div>
                    </div>
                    <div>
                      <div className="text-purple-300">Win Rate</div>
                      <div className="text-white font-bold">{winRate}%</div>
                    </div>
                    <div>
                      <div className="text-purple-300">HP</div>
                      <div className="text-white font-bold">{monster.baseStats.hp}</div>
                    </div>
                    <div>
                      <div className="text-purple-300">ATK</div>
                      <div className="text-white font-bold">{monster.baseStats.attack}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-purple-400/20">
                    <button
                      className="flex-1 text-xs bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 py-1 rounded transition-colors"
                    >
                      View
                    </button>
                    <button
                      className="flex-1 text-xs bg-orange-600/40 hover:bg-orange-600/60 text-orange-200 py-1 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <Zap size={12} /> Battle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="w-full bg-purple-700/50 hover:bg-purple-600/50 text-white py-2 rounded-lg text-sm transition-colors"
        >
          ← Back to Arcade
        </button>
      </div>
    </div>
  );
}
