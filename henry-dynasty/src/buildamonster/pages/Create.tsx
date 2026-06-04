import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Save } from "lucide-react";
import { useBuildamonster, CustomMonster, MonsterPart } from "../state/store";
import { getPartsByType, calculateCombinedStats } from "../engine/parts";

export default function CreateMonster() {
  const navigate = useNavigate();
  const createMonster = useBuildamonster((s) => s.createMonster);
  
  const [name, setName] = useState("");
  const [selectedHead, setSelectedHead] = useState<MonsterPart | null>(null);
  const [selectedBody, setSelectedBody] = useState<MonsterPart | null>(null);
  const [selectedLegs, setSelectedLegs] = useState<MonsterPart | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<MonsterPart[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>("head");

  const headParts = getPartsByType("head");
  const bodyParts = getPartsByType("body");
  const legsParts = getPartsByType("legs");
  const accessoryParts = getPartsByType("accessory");

  const baseStats = calculateCombinedStats({
    head: selectedHead,
    body: selectedBody,
    legs: selectedLegs,
    accessories: selectedAccessories,
  });

  const toggleAccessory = (part: MonsterPart) => {
    if (selectedAccessories.find((p) => p.id === part.id)) {
      setSelectedAccessories(selectedAccessories.filter((p) => p.id !== part.id));
    } else {
      setSelectedAccessories([...selectedAccessories, part]);
    }
  };

  const handleCreateMonster = () => {
    if (!name.trim() || !selectedHead || !selectedBody || !selectedLegs) {
      alert("Please select a name and all main body parts");
      return;
    }

    const newMonster: CustomMonster = {
      id: `monster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      createdAt: Date.now(),
      parts: {
        head: selectedHead,
        body: selectedBody,
        legs: selectedLegs,
        accessories: selectedAccessories,
      },
      baseStats,
      wins: 0,
      losses: 0,
      level: 1,
      experience: 0,
    };

    createMonster(newMonster);
    navigate("/buildamonster");
  };

  const PartSelector = ({
    title,
    parts,
    selected,
    onSelect,
    sectionKey,
    allowMultiple = false,
  }: {
    title: string;
    parts: MonsterPart[];
    selected: MonsterPart | MonsterPart[] | null;
    onSelect: (part: MonsterPart) => void;
    sectionKey: string;
    allowMultiple?: boolean;
  }) => {
    const isExpanded = expandedSection === sectionKey;
    const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];

    return (
      <div className="border border-purple-400/30 rounded-lg overflow-hidden mb-4">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
          className="w-full bg-purple-700/50 hover:bg-purple-700/70 text-white font-bold py-3 px-4 flex items-center justify-between transition-colors"
        >
          <span>
            {title} {selectedArray.length > 0 && `(${selectedArray.length})`}
          </span>
          <ChevronDown
            size={20}
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {isExpanded && (
          <div className="bg-purple-900/50 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {parts.map((part) => {
              const isSelected = selectedArray.some((p) => p.id === part.id);
              return (
                <button
                  key={part.id}
                  onClick={() => onSelect(part)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    isSelected
                      ? "bg-cyan-600/70 border border-cyan-400"
                      : "bg-purple-700/40 border border-purple-400/30 hover:bg-purple-700/60"
                  }`}
                >
                  <div className="text-2xl mb-1">{part.sprite}</div>
                  <div className="font-bold text-white text-sm">{part.name}</div>
                  <div className="text-xs text-purple-300 mt-1">
                    HP:{part.stats.hp} ATK:{part.stats.attack} DEF:{part.stats.defense} SPD:
                    {part.stats.speed}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/buildamonster")}
            className="text-purple-300 hover:text-purple-100 text-sm mb-4 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Create Your Monster</h1>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-white font-bold mb-2">Monster Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., FrostDragon, ThunderBear..."
            className="w-full bg-purple-800/50 border border-purple-400/30 rounded-lg px-4 py-3 text-white placeholder-purple-400 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Part Selectors */}
        <PartSelector
          title="🗣️ Head"
          parts={headParts}
          selected={selectedHead}
          onSelect={setSelectedHead}
          sectionKey="head"
        />

        <PartSelector
          title="💪 Body"
          parts={bodyParts}
          selected={selectedBody}
          onSelect={setSelectedBody}
          sectionKey="body"
        />

        <PartSelector
          title="🦵 Legs"
          parts={legsParts}
          selected={selectedLegs}
          onSelect={setSelectedLegs}
          sectionKey="legs"
        />

        <PartSelector
          title="⭐ Accessories (Optional)"
          parts={accessoryParts}
          selected={selectedAccessories}
          onSelect={toggleAccessory}
          sectionKey="accessories"
          allowMultiple={true}
        />

        {/* Preview Section */}
        {(selectedHead || selectedBody || selectedLegs) && (
          <div className="bg-gradient-to-br from-purple-700/50 to-indigo-700/50 backdrop-blur border border-purple-400/30 rounded-lg p-6 mb-6">
            <h2 className="text-white font-bold text-lg mb-4">Preview</h2>

            <div className="text-center mb-6">
              <div className="text-5xl inline-block">
                {selectedHead?.sprite}
                {selectedBody?.sprite}
                {selectedLegs?.sprite}
                {selectedAccessories.length > 0 && selectedAccessories[0].sprite}
              </div>
              <p className="text-white font-bold mt-2">{name || "Your Monster"}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-purple-900/50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{baseStats.hp}</div>
                <div className="text-xs text-purple-300">HP</div>
              </div>
              <div className="bg-purple-900/50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-orange-400">{baseStats.attack}</div>
                <div className="text-xs text-purple-300">ATK</div>
              </div>
              <div className="bg-purple-900/50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{baseStats.defense}</div>
                <div className="text-xs text-purple-300">DEF</div>
              </div>
              <div className="bg-purple-900/50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{baseStats.speed}</div>
                <div className="text-xs text-purple-300">SPD</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/buildamonster")}
            className="flex-1 bg-purple-700/50 hover:bg-purple-600/50 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateMonster}
            disabled={!name.trim() || !selectedHead || !selectedBody || !selectedLegs}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Create Monster
          </button>
        </div>
      </div>
    </div>
  );
}
