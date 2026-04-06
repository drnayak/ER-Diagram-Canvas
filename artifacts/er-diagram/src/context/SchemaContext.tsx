import { createContext, useContext, useState, ReactNode } from "react";
import { Schema } from "../types";

function inferModule(tableName: string, index: number): string {
  const name = tableName.toLowerCase();
  if (name.includes("compan") || name.includes("client") || name.includes("customer")) return "company";
  if (name.includes("sale") || name.includes("order") || name.includes("invoice")) return "sales";
  if (name.includes("inventor") || name.includes("stock") || name.includes("product") || name.includes("item")) return "inventory";
  if (name.includes("warehouse") || name.includes("storage") || name.includes("location")) return "warehouse";
  if (name.includes("user") || name.includes("employee") || name.includes("staff")) return "hr";
  if (name.includes("payment") || name.includes("finance") || name.includes("currency")) return "finance";
  const fallbacks = ["company", "sales", "inventory", "warehouse", "finance", "hr", "logistics", "crm"];
  return fallbacks[index % fallbacks.length];
}

export function normalizeSchema(raw: Record<string, unknown>): Schema {
  const rawTables = (raw.tables as unknown[]) ?? [];
  const rawRels = (raw.relationships as unknown[]) ?? [];

  const tables = rawTables.map((t: unknown, i: number) => {
    const tbl = t as Record<string, unknown>;
    const rawCols = (tbl.columns as unknown[]) ?? [];
    const rawIdxs = (tbl.indexes as unknown[]) ?? [];

    const columns = rawCols.map((c: unknown) => {
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
      primary_key: tbl.primary_key ? String(tbl.primary_key) : pkCol?.name,
      module: tbl.module ? String(tbl.module) : inferModule(String(tbl.table_name ?? ""), i),
      columns,
      indexes: rawIdxs.map((idx: unknown) => {
        const idxObj = idx as Record<string, unknown>;
        return {
          name: String(idxObj.name ?? ""),
          columns: ((idxObj.columns as string[]) ?? []).map(String),
        };
      }),
    };
  });

  const relationships = rawRels.map((r: unknown) => {
    const rel = r as Record<string, unknown>;
    return {
      from: String(rel.from ?? ""),
      to: String(rel.to ?? ""),
      type: String(rel.type ?? "many-to-one"),
    };
  });

  return {
    database: raw.database ? String(raw.database) : undefined,
    version: raw.version ? String(raw.version) : undefined,
    tables,
    relationships,
  };
}

interface SchemaContextValue {
  schema: Schema | null;
  fileName: string | null;
  loadSchema: (raw: Record<string, unknown>, fileName: string) => void;
  clearSchema: () => void;
}

const SchemaContext = createContext<SchemaContextValue>({
  schema: null,
  fileName: null,
  loadSchema: () => {},
  clearSchema: () => {},
});

export function SchemaProvider({ children }: { children: ReactNode }) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const loadSchema = (raw: Record<string, unknown>, name: string) => {
    const normalized = normalizeSchema(raw);
    setSchema(normalized);
    setFileName(name);
  };

  const clearSchema = () => {
    setSchema(null);
    setFileName(null);
  };

  return (
    <SchemaContext.Provider value={{ schema, fileName, loadSchema, clearSchema }}>
      {children}
    </SchemaContext.Provider>
  );
}

export function useSchema() {
  return useContext(SchemaContext);
}
