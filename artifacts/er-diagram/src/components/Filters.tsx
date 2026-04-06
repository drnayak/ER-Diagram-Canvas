import { useStore, RelationshipFilter } from "../store/useStore";
import { Filter, GitBranch, Layers } from "lucide-react";

const REL_OPTIONS: { value: RelationshipFilter; label: string }[] = [
  { value: "all", label: "All Relations" },
  { value: "many-to-one", label: "Many → One" },
  { value: "one-to-many", label: "One → Many" },
];

const DEPTH_OPTIONS: { value: 1 | 2; label: string }[] = [
  { value: 1, label: "Level 1 (Direct)" },
  { value: 2, label: "Level 2 (Extended)" },
];

export default function Filters() {
  const {
    relationshipFilter, setRelationshipFilter,
    showOrphans, setShowOrphans,
    showOnlyConnected, setShowOnlyConnected,
    depthFilter, setDepthFilter,
  } = useStore();

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 flex-wrap">
      <div className="flex items-center gap-1.5 text-gray-400">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold uppercase tracking-widest">Filters</span>
      </div>

      <div className="w-px h-5 bg-gray-700" />

      <div className="flex items-center gap-1.5">
        <GitBranch className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-400">Relations:</span>
        <div className="flex gap-1">
          {REL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRelationshipFilter(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                relationshipFilter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-gray-700" />

      <div className="flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-400">Depth:</span>
        <div className="flex gap-1">
          {DEPTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDepthFilter(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                depthFilter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-gray-700" />

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showOrphans}
            onChange={(e) => setShowOrphans(e.target.checked)}
            className="accent-blue-500 w-3.5 h-3.5"
          />
          <span className="text-xs text-gray-400">Show orphans</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyConnected}
            onChange={(e) => setShowOnlyConnected(e.target.checked)}
            className="accent-blue-500 w-3.5 h-3.5"
          />
          <span className="text-xs text-gray-400">Only connected</span>
        </label>
      </div>
    </div>
  );
}
