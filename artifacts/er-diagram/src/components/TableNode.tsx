import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Table } from "../types";
import { useStore } from "../store/useStore";

interface TableNodeData {
  table: Table;
  isHighlighted: boolean;
  isConnected: boolean;
  isDimmed: boolean;
}

const MODULE_COLORS: Record<string, { header: string; border: string }> = {
  company:   { header: "bg-violet-600",  border: "border-violet-300" },
  sales:     { header: "bg-blue-600",    border: "border-blue-300" },
  inventory: { header: "bg-emerald-600", border: "border-emerald-300" },
  warehouse: { header: "bg-amber-600",   border: "border-amber-300" },
  finance:   { header: "bg-rose-600",    border: "border-rose-300" },
  hr:        { header: "bg-pink-600",    border: "border-pink-300" },
  logistics: { header: "bg-cyan-600",    border: "border-cyan-300" },
  crm:       { header: "bg-indigo-600",  border: "border-indigo-300" },
  admin:     { header: "bg-gray-600",    border: "border-gray-300" },
  reporting: { header: "bg-teal-600",    border: "border-teal-300" },
};

const DEFAULT_COLOR = { header: "bg-slate-600", border: "border-slate-300" };

function TableNode({ data }: NodeProps<TableNodeData>) {
  const { table, isDimmed } = data;
  const { setSelectedTableName, setHighlightedTableName } = useStore();
  const colors = MODULE_COLORS[table.module ?? ""] ?? DEFAULT_COLOR;

  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-md transition-all duration-200 overflow-hidden cursor-pointer select-none
        ${colors.border}
        ${isDimmed ? "opacity-25" : "opacity-100"}
        hover:shadow-xl hover:scale-[1.01]`}
      style={{ width: 280, minWidth: 280 }}
      onClick={() => setSelectedTableName(table.table_name)}
      onMouseEnter={() => setHighlightedTableName(table.table_name)}
      onMouseLeave={() => setHighlightedTableName(null)}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />

      <div className={`${colors.header} px-3 py-2.5 flex items-center gap-2`}>
        <span className="font-mono text-xs text-white/70 font-semibold uppercase tracking-widest">
          {table.module ?? "table"}
        </span>
        <div className="flex-1" />
        {table.primary_key && (
          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
            PK: {table.primary_key}
          </span>
        )}
      </div>

      <div className="px-3 py-2 border-b border-gray-100">
        <p className="font-bold text-gray-900 text-sm">{table.table_name}</p>
        {table.description && (
          <p className="text-[11px] text-gray-400 truncate">{table.description}</p>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {table.columns.map((col) => (
          <div
            key={col.name}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs
              ${col.pk ? "bg-yellow-50" : col.fk ? "bg-blue-50/50" : ""}`}
          >
            <div className="flex gap-1 w-8 shrink-0">
              {col.pk && (
                <span className="text-yellow-600 font-bold text-[10px] leading-none">PK</span>
              )}
              {col.fk && !col.pk && (
                <span className="text-blue-500 font-bold text-[10px] leading-none">FK</span>
              )}
            </div>
            <span className={`flex-1 font-medium truncate ${col.pk ? "text-yellow-800" : col.fk ? "text-blue-700" : "text-gray-700"}`}>
              {col.name}
            </span>
            <span className="text-gray-400 font-mono text-[10px] shrink-0">{col.type}</span>
          </div>
        ))}
      </div>

      {(table.indexes?.length ?? 0) > 0 && (
        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
            Indexes ({table.indexes!.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {table.indexes!.map((idx) => (
              <span
                key={idx.name}
                className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono"
              >
                {idx.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(TableNode);
