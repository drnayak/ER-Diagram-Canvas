import { create } from "zustand";
import { Table, Relationship } from "../types";

export type RelationshipFilter = "all" | "many-to-one" | "one-to-many";
export type DepthFilter = 1 | 2;

interface StoreState {
  selectedTables: Set<string>;
  searchQuery: string;
  relationshipFilter: RelationshipFilter;
  showOrphans: boolean;
  showOnlyConnected: boolean;
  selectedTableName: string | null;
  selectedRelationship: Relationship | null;
  depthFilter: DepthFilter;
  highlightedTableName: string | null;

  initTables: (tableNames: string[]) => void;
  setSelectedTables: (tables: Set<string>) => void;
  toggleTable: (tableName: string) => void;
  selectAll: (tableNames: string[]) => void;
  deselectAll: () => void;
  setSearchQuery: (query: string) => void;
  setRelationshipFilter: (filter: RelationshipFilter) => void;
  setShowOrphans: (show: boolean) => void;
  setShowOnlyConnected: (show: boolean) => void;
  setSelectedTableName: (name: string | null) => void;
  setSelectedRelationship: (rel: Relationship | null) => void;
  setDepthFilter: (depth: DepthFilter) => void;
  setHighlightedTableName: (name: string | null) => void;
  reset: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  selectedTables: new Set(),
  searchQuery: "",
  relationshipFilter: "all",
  showOrphans: true,
  showOnlyConnected: false,
  selectedTableName: null,
  selectedRelationship: null,
  depthFilter: 1,
  highlightedTableName: null,

  initTables: (tableNames) => set({ selectedTables: new Set(tableNames), selectedTableName: null, selectedRelationship: null }),

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

  selectAll: (tableNames) => set({ selectedTables: new Set(tableNames) }),
  deselectAll: () => set({ selectedTables: new Set() }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setRelationshipFilter: (filter) => set({ relationshipFilter: filter }),
  setShowOrphans: (show) => set({ showOrphans: show }),
  setShowOnlyConnected: (show) => set({ showOnlyConnected: show }),
  setSelectedTableName: (name) => set({ selectedTableName: name, selectedRelationship: null }),
  setSelectedRelationship: (rel) => set({ selectedRelationship: rel, selectedTableName: null }),
  setDepthFilter: (depth) => set({ depthFilter: depth }),
  setHighlightedTableName: (name) => set({ highlightedTableName: name }),

  reset: () =>
    set({
      selectedTables: new Set(),
      searchQuery: "",
      relationshipFilter: "all",
      showOrphans: true,
      showOnlyConnected: false,
      selectedTableName: null,
      selectedRelationship: null,
      depthFilter: 1,
      highlightedTableName: null,
    }),
}));

// Pure helper functions
export function getFilteredTables(
  tables: Table[],
  selectedTables: Set<string>,
  searchQuery: string,
  relationships: Relationship[],
  showOnlyConnected: boolean,
  showOrphans: boolean
): Table[] {
  const connectedTables = new Set<string>();
  relationships.forEach((r) => {
    connectedTables.add(r.from.split(".")[0]);
    connectedTables.add(r.to.split(".")[0]);
  });

  return tables.filter((table) => {
    if (!selectedTables.has(table.table_name)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const tableMatch = table.table_name.toLowerCase().includes(q);
      const colMatch = table.columns.some((c) => c.name.toLowerCase().includes(q));
      if (!tableMatch && !colMatch) return false;
    }
    const isConnected = connectedTables.has(table.table_name);
    if (showOnlyConnected && !isConnected) return false;
    if (!showOrphans && !isConnected) return false;
    return true;
  });
}

export function getActiveRelationships(
  relationships: Relationship[],
  selectedTables: Set<string>,
  relationshipFilter: RelationshipFilter
): Relationship[] {
  return relationships.filter((rel) => {
    const sourceTable = rel.from.split(".")[0];
    const targetTable = rel.to.split(".")[0];
    if (!selectedTables.has(sourceTable) || !selectedTables.has(targetTable)) return false;
    if (relationshipFilter === "all") return true;
    return rel.type === relationshipFilter;
  });
}
