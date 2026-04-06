import { create } from "zustand";
import { erSchema, Table } from "../data/schema";

export type RelationshipFilter = "all" | "many-to-one" | "one-to-many";
export type DepthFilter = 1 | 2;

interface StoreState {
  selectedTables: Set<string>;
  searchQuery: string;
  relationshipFilter: RelationshipFilter;
  showOrphans: boolean;
  showOnlyConnected: boolean;
  selectedTableName: string | null;
  depthFilter: DepthFilter;
  highlightedTableName: string | null;

  setSelectedTables: (tables: Set<string>) => void;
  toggleTable: (tableName: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setSearchQuery: (query: string) => void;
  setRelationshipFilter: (filter: RelationshipFilter) => void;
  setShowOrphans: (show: boolean) => void;
  setShowOnlyConnected: (show: boolean) => void;
  setSelectedTableName: (name: string | null) => void;
  setDepthFilter: (depth: DepthFilter) => void;
  setHighlightedTableName: (name: string | null) => void;

  getSelectedTableData: () => Table | null;
  getFilteredTables: () => Table[];
  getActiveRelationships: () => typeof erSchema.relationships;
}

const allTableNames = new Set(erSchema.tables.map((t) => t.table_name));

export const useStore = create<StoreState>((set, get) => ({
  selectedTables: new Set(allTableNames),
  searchQuery: "",
  relationshipFilter: "all",
  showOrphans: true,
  showOnlyConnected: false,
  selectedTableName: null,
  depthFilter: 1,
  highlightedTableName: null,

  setSelectedTables: (tables) => set({ selectedTables: tables }),

  toggleTable: (tableName) => {
    const current = new Set(get().selectedTables);
    if (current.has(tableName)) {
      current.delete(tableName);
    } else {
      current.add(tableName);
    }
    set({ selectedTables: current });
  },

  selectAll: () => set({ selectedTables: new Set(allTableNames) }),

  deselectAll: () => set({ selectedTables: new Set() }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setRelationshipFilter: (filter) => set({ relationshipFilter: filter }),

  setShowOrphans: (show) => set({ showOrphans: show }),

  setShowOnlyConnected: (show) => set({ showOnlyConnected: show }),

  setSelectedTableName: (name) => set({ selectedTableName: name }),

  setDepthFilter: (depth) => set({ depthFilter: depth }),

  setHighlightedTableName: (name) => set({ highlightedTableName: name }),

  getSelectedTableData: () => {
    const { selectedTableName } = get();
    if (!selectedTableName) return null;
    return erSchema.tables.find((t) => t.table_name === selectedTableName) ?? null;
  },

  getFilteredTables: () => {
    const { selectedTables, searchQuery, showOnlyConnected, showOrphans } = get();
    const relationships = get().getActiveRelationships();

    const connectedTables = new Set<string>();
    relationships.forEach((r) => {
      connectedTables.add(r.from.split(".")[0]);
      connectedTables.add(r.to.split(".")[0]);
    });

    return erSchema.tables.filter((table) => {
      if (!selectedTables.has(table.table_name)) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const tableMatch = table.table_name.toLowerCase().includes(q);
        const colMatch = table.columns.some((c) =>
          c.name.toLowerCase().includes(q)
        );
        if (!tableMatch && !colMatch) return false;
      }

      const isConnected = connectedTables.has(table.table_name);

      if (showOnlyConnected && !isConnected) return false;
      if (!showOrphans && !isConnected) return false;

      return true;
    });
  },

  getActiveRelationships: () => {
    const { selectedTables, relationshipFilter } = get();

    return erSchema.relationships.filter((rel) => {
      const sourceTable = rel.from.split(".")[0];
      const targetTable = rel.to.split(".")[0];

      if (!selectedTables.has(sourceTable) || !selectedTables.has(targetTable))
        return false;

      if (relationshipFilter === "all") return true;
      return rel.type === relationshipFilter;
    });
  },
}));
