import { useState } from "react";
import { erSchema } from "../data/schema";
import { useStore } from "../store/useStore";
import { Search, ChevronDown, ChevronRight } from "lucide-react";

const MODULE_LABELS: Record<string, { label: string; color: string }> = {
  company: { label: "Company", color: "bg-violet-500" },
  sales: { label: "Sales", color: "bg-blue-500" },
  inventory: { label: "Inventory", color: "bg-emerald-500" },
  warehouse: { label: "Warehouse", color: "bg-amber-500" },
};

export default function Sidebar() {
  const {
    selectedTables,
    toggleTable,
    selectAll,
    deselectAll,
    searchQuery,
    setSearchQuery,
  } = useStore();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = erSchema.tables.reduce(
    (acc, table) => {
      const mod = table.module;
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(table);
      return acc;
    },
    {} as Record<string, typeof erSchema.tables>
  );

  const allSelected =
    selectedTables.size === erSchema.tables.length;
  const someSelected = selectedTables.size > 0 && !allSelected;

  const toggleGroup = (mod: string) => {
    const tables = grouped[mod];
    const allGroupSelected = tables.every((t) =>
      selectedTables.has(t.table_name)
    );
    const next = new Set(selectedTables);
    tables.forEach((t) => {
      if (allGroupSelected) {
        next.delete(t.table_name);
      } else {
        next.add(t.table_name);
      }
    });
    useStore.setState({ selectedTables: next });
  };

  const toggleCollapse = (mod: string) => {
    setCollapsed((prev) => ({ ...prev, [mod]: !prev[mod] }));
  };

  const filteredGrouped = Object.entries(grouped).reduce(
    (acc, [mod, tables]) => {
      const filtered = tables.filter(
        (t) =>
          !searchQuery ||
          t.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.columns.some((c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      if (filtered.length > 0) acc[mod] = filtered;
      return acc;
    },
    {} as Record<string, typeof erSchema.tables>
  );

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 w-64 shrink-0 border-r border-gray-800">
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Tables
          </span>
          <span className="ml-auto text-[11px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
            {selectedTables.size}/{erSchema.tables.length}
          </span>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
          <input
            type="search"
            placeholder="Search tables, columns..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="flex-1 text-xs py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="flex-1 text-xs py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {Object.entries(filteredGrouped).map(([mod, tables]) => {
          const meta = MODULE_LABELS[mod] ?? { label: mod, color: "bg-gray-500" };
          const allGroupSelected = tables.every((t) =>
            selectedTables.has(t.table_name)
          );
          const someGroupSelected =
            tables.some((t) => selectedTables.has(t.table_name)) &&
            !allGroupSelected;
          const isCollapsed = collapsed[mod];

          return (
            <div key={mod} className="mb-1">
              <div className="flex items-center px-3 py-2 hover:bg-gray-800/50 group">
                <button
                  onClick={() => toggleCollapse(mod)}
                  className="text-gray-500 hover:text-gray-300 mr-1"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  type="checkbox"
                  checked={allGroupSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someGroupSelected;
                  }}
                  onChange={() => toggleGroup(mod)}
                  className="mr-2 accent-blue-500 w-3 h-3"
                />
                <div className={`w-2 h-2 rounded-full ${meta.color} mr-2 shrink-0`} />
                <span className="text-xs font-semibold text-gray-300 flex-1">
                  {meta.label}
                </span>
                <span className="text-[10px] text-gray-600">
                  {tables.length}
                </span>
              </div>

              {!isCollapsed && (
                <div className="ml-7">
                  {tables.map((table) => (
                    <label
                      key={table.table_name}
                      className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-800/40 rounded group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTables.has(table.table_name)}
                        onChange={() => toggleTable(table.table_name)}
                        className="accent-blue-500 w-3 h-3 shrink-0"
                      />
                      <span
                        className={`text-xs truncate ${
                          selectedTables.has(table.table_name)
                            ? "text-gray-200"
                            : "text-gray-500"
                        }`}
                      >
                        {table.table_name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
