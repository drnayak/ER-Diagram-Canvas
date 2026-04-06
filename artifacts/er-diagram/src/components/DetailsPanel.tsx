import { useStore } from "../store/useStore";
import { erSchema } from "../data/schema";
import { X, Key, Link, Database, Hash } from "lucide-react";

const MODULE_BADGE: Record<string, string> = {
  company: "bg-violet-100 text-violet-700",
  sales: "bg-blue-100 text-blue-700",
  inventory: "bg-emerald-100 text-emerald-700",
  warehouse: "bg-amber-100 text-amber-700",
};

export default function DetailsPanel() {
  const { selectedTableName, setSelectedTableName, getSelectedTableData } = useStore();
  const table = getSelectedTableData();

  if (!selectedTableName || !table) return null;

  const relatedFrom = erSchema.relationships.filter(
    (r) => r.from.split(".")[0] === table.table_name
  );
  const relatedTo = erSchema.relationships.filter(
    (r) => r.to.split(".")[0] === table.table_name
  );

  return (
    <div className="w-72 shrink-0 flex flex-col bg-white border-l border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">
            Table Details
          </p>
          <p className="font-bold text-gray-900 text-sm">{table.table_name}</p>
        </div>
        <button
          onClick={() => setSelectedTableName(null)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                MODULE_BADGE[table.module] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {table.module}
            </span>
          </div>
          <p className="text-xs text-gray-500">{table.description}</p>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Database className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Columns ({table.columns.length})
            </p>
          </div>
          <div className="space-y-1">
            {table.columns.map((col) => (
              <div
                key={col.name}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                  col.pk
                    ? "bg-yellow-50 border border-yellow-100"
                    : col.fk
                    ? "bg-blue-50 border border-blue-100"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-1 w-8 shrink-0">
                  {col.pk && <Key className="w-3 h-3 text-yellow-500" />}
                  {col.fk && !col.pk && <Link className="w-3 h-3 text-blue-400" />}
                </div>
                <span
                  className={`flex-1 font-medium truncate ${
                    col.pk
                      ? "text-yellow-800"
                      : col.fk
                      ? "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {col.name}
                </span>
                <span className="text-gray-400 font-mono text-[10px] shrink-0">
                  {col.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {table.indexes.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Hash className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Indexes ({table.indexes.length})
              </p>
            </div>
            <div className="space-y-1.5">
              {table.indexes.map((idx) => (
                <div key={idx.name} className="bg-gray-50 rounded-lg px-2 py-1.5">
                  <p className="text-[11px] font-semibold text-gray-700 font-mono">
                    {idx.name}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    [{idx.columns.join(", ")}]
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(relatedFrom.length > 0 || relatedTo.length > 0) && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Link className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Relationships
              </p>
            </div>
            {relatedFrom.map((rel, i) => (
              <div
                key={`from-${i}`}
                className="text-xs py-1.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-semibold">
                    {rel.type}
                  </span>
                </div>
                <p className="text-gray-500 mt-1 font-mono text-[10px]">
                  <span className="text-blue-600">{rel.from}</span>
                  <span className="text-gray-400 mx-1">→</span>
                  <span className="text-gray-700">{rel.to}</span>
                </p>
              </div>
            ))}
            {relatedTo.map((rel, i) => (
              <div
                key={`to-${i}`}
                className="text-xs py-1.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-semibold">
                    {rel.type}
                  </span>
                </div>
                <p className="text-gray-500 mt-1 font-mono text-[10px]">
                  <span className="text-gray-700">{rel.from}</span>
                  <span className="text-gray-400 mx-1">→</span>
                  <span className="text-blue-600">{rel.to}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
