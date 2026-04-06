import { create } from "zustand";
import { Schema, Table, Relationship } from "../types";

export type RelationshipFilter = "all" | "many-to-one" | "one-to-many";
export type DepthFilter = 1 | 2;

const MODULE_COLORS = [
  "company", "sales", "inventory", "warehouse",
  "finance", "hr", "logistics", "crm", "admin", "reporting",
];

function inferModule(tableName: string, index: number, modules: string[]): string {
  if (modules[index]) return modules[index];
  const name = tableName.toLowerCase();
  if (name.includes("compan") || name.includes("client") || name.includes("customer")) return "company";
  if (name.includes("sale") || name.includes("order") || name.includes("invoice")) return "sales";
  if (name.includes("inventor") || name.includes("stock") || name.includes("product") || name.includes("item")) return "inventory";
  if (name.includes("warehouse") || name.includes("storage") || name.includes("location")) return "warehouse";
  if (name.includes("user") || name.includes("employee") || name.includes("staff")) return "hr";
  if (name.includes("payment") || name.includes("finance") || name.includes("currency")) return "finance";
  return MODULE_COLORS[index % MODULE_COLORS.length];
}

function normalizeSchema(raw: unknown): Schema {
  const obj = raw as Record<string, unknown>;
  const rawTables = (obj.tables as unknown[]) ?? [];
  const rawRels = (obj.relationships as unknown[]) ?? [];
  const modules: string[] = (obj.erd_metadata as Record<string, unknown>)?.modules as string[] ?? [];

  const tables: Table[] = rawTables.map((t, i) => {
    const tbl = t as Record<string, unknown>;
    const rawCols = (tbl.columns as unknown[]) ?? [];
    const rawIdxs = (tbl.indexes as unknown[]) ?? [];

    const columns = rawCols.map((c) => {
      const col = c as Record<string, unknown>;
      return {
        name: String(col.name ?? ""),
        type: String(col.type ?? ""),
        pk: Boolean(col.pk),
        fk: col.fk ? String(col.fk) : undefined,
      };
    });

    const pkCol = columns.find((c) => c.pk);

    return {
      table_name: String(tbl.table_name ?? tbl.name ?? `table_${i}`),
      description: tbl.description ? String(tbl.description) : undefined,
      primary_key: tbl.primary_key
        ? String(tbl.primary_key)
        : pkCol?.name,
      module: tbl.module
        ? String(tbl.module)
        : inferModule(String(tbl.table_name ?? ""), i, modules),
      columns,
      indexes: rawIdxs.map((idx) => {
        const idxObj = idx as Record<string, unknown>;
        return {
          name: String(idxObj.name ?? ""),
          columns: ((idxObj.columns as string[]) ?? []).map(String),
        };
      }),
    };
  });

  const relationships: Relationship[] = rawRels.map((r) => {
    const rel = r as Record<string, unknown>;
    return {
      from: String(rel.from ?? ""),
      to: String(rel.to ?? ""),
      type: String(rel.type ?? "many-to-one"),
    };
  });

  return {
    database: obj.database ? String(obj.database) : undefined,
    version: obj.version ? String(obj.version) : undefined,
    tables,
    relationships,
  };
}

interface StoreState {
  schema: Schema | null;
  fileName: string | null;
  selectedTables: Set<string>;
  searchQuery: string;
  relationshipFilter: RelationshipFilter;
  showOrphans: boolean;
  showOnlyConnected: boolean;
  selectedTableName: string | null;
  depthFilter: DepthFilter;
  highlightedTableName: string | null;

  loadSchema: (raw: unknown, fileName: string) => void;
  clearSchema: () => void;
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
  getActiveRelationships: () => Relationship[];
}

export const useStore = create<StoreState>((set, get) => ({
  schema: null,
  fileName: null,
  selectedTables: new Set(),
  searchQuery: "",
  relationshipFilter: "all",
  showOrphans: true,
  showOnlyConnected: false,
  selectedTableName: null,
  depthFilter: 1,
  highlightedTableName: null,

  loadSchema: (raw, fileName) => {
    const schema = normalizeSchema(raw);
    const allNames = new Set(schema.tables.map((t) => t.table_name));
    set({ schema, fileName, selectedTables: allNames, selectedTableName: null });
  },

  clearSchema: () =>
    set({
      schema: null,
      fileName: null,
      selectedTables: new Set(),
      selectedTableName: null,
      searchQuery: "",
    }),

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

  selectAll: () => {
    const schema = get().schema;
    if (!schema) return;
    set({ selectedTables: new Set(schema.tables.map((t) => t.table_name)) });
  },

  deselectAll: () => set({ selectedTables: new Set() }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setRelationshipFilter: (filter) => set({ relationshipFilter: filter }),
  setShowOrphans: (show) => set({ showOrphans: show }),
  setShowOnlyConnected: (show) => set({ showOnlyConnected: show }),
  setSelectedTableName: (name) => set({ selectedTableName: name }),
  setDepthFilter: (depth) => set({ depthFilter: depth }),
  setHighlightedTableName: (name) => set({ highlightedTableName: name }),

  getSelectedTableData: () => {
    const { selectedTableName, schema } = get();
    if (!selectedTableName || !schema) return null;
    return schema.tables.find((t) => t.table_name === selectedTableName) ?? null;
  },

  getFilteredTables: () => {
    const { schema, selectedTables, searchQuery, showOnlyConnected, showOrphans } = get();
    if (!schema) return [];
    const relationships = get().getActiveRelationships();

    const connectedTables = new Set<string>();
    relationships.forEach((r) => {
      connectedTables.add(r.from.split(".")[0]);
      connectedTables.add(r.to.split(".")[0]);
    });

    return schema.tables.filter((table) => {
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
    const { schema, selectedTables, relationshipFilter } = get();
    if (!schema) return [];

    return schema.relationships.filter((rel) => {
      const sourceTable = rel.from.split(".")[0];
      const targetTable = rel.to.split(".")[0];
      if (!selectedTables.has(sourceTable) || !selectedTables.has(targetTable))
        return false;
      if (relationshipFilter === "all") return true;
      return rel.type === relationshipFilter;
    });
  },
}));
