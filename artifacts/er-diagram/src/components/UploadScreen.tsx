import { useCallback, useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { Upload, FileJson, AlertCircle, CheckCircle2 } from "lucide-react";

export default function UploadScreen() {
  const { loadSchema } = useStore();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".json")) {
        setError("Please upload a valid .json file.");
        return;
      }
      setLoading(true);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string);
          if (!raw.tables || !Array.isArray(raw.tables)) {
            throw new Error('JSON must have a "tables" array.');
          }
          loadSchema(raw, file.name);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Invalid JSON format.");
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setLoading(false);
      };
      reader.readAsText(file);
    },
    [loadSchema]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const SAMPLE_SCHEMA = {
    database: "erp_sales_inventory",
    version: "1.0",
    tables: [
      {
        table_name: "tblcompanies",
        description: "Stores company master data",
        primary_key: "userid",
        columns: [
          { name: "userid", type: "int", pk: true },
          { name: "company", type: "string" },
          { name: "primary_domain", type: "string" },
          { name: "email_1", type: "string" },
          { name: "country", type: "int", fk: "country_master.id" },
          { name: "city", type: "string" },
          { name: "state", type: "string" },
          { name: "zip", type: "string" },
          { name: "address", type: "text" },
          { name: "company_id", type: "int" },
          { name: "client_approval_status", type: "int" },
          { name: "created_at", type: "datetime" },
          { name: "updated_date", type: "timestamp" },
        ],
        indexes: [
          { name: "idx_primary_domain", columns: ["primary_domain"] },
          { name: "idx_company_id", columns: ["company_id"] },
        ],
      },
      {
        table_name: "sales_master",
        description: "Sales order header table",
        primary_key: "id",
        columns: [
          { name: "id", type: "int", pk: true },
          { name: "clientid", type: "int", fk: "tblcompanies.userid" },
          { name: "company_id", type: "int" },
          { name: "number", type: "int" },
          { name: "year", type: "int" },
          { name: "date", type: "datetime" },
          { name: "currency", type: "int", fk: "currency_master.id" },
          { name: "subtotal", type: "decimal" },
          { name: "total_tax", type: "decimal" },
          { name: "total", type: "decimal" },
          { name: "status", type: "int" },
          { name: "sale_agent", type: "int" },
          { name: "warehouse_id", type: "int", fk: "tblmasterwarehouse.id" },
          { name: "created_at", type: "datetime" },
          { name: "updated_date", type: "timestamp" },
        ],
        indexes: [
          { name: "idx_clientid", columns: ["clientid"] },
          { name: "idx_company_date", columns: ["company_id", "date"] },
          { name: "idx_status", columns: ["status"] },
        ],
      },
      {
        table_name: "sales_items",
        description: "Sales order line items",
        primary_key: "id",
        columns: [
          { name: "id", type: "int", pk: true },
          { name: "salesorderid", type: "int", fk: "sales_master.id" },
          { name: "inventory_id", type: "int", fk: "master_inventory.id" },
          { name: "warehouse", type: "int", fk: "tblmasterwarehouse.id" },
          { name: "description", type: "string" },
          { name: "qty", type: "decimal" },
          { name: "rate", type: "decimal" },
          { name: "billing_rate", type: "decimal" },
          { name: "ship_status", type: "string" },
          { name: "expect_ship_date", type: "datetime" },
          { name: "company_id", type: "int" },
          { name: "created_at", type: "timestamp" },
        ],
        indexes: [
          { name: "idx_salesorderid", columns: ["salesorderid"] },
          { name: "idx_inventory", columns: ["inventory_id"] },
          { name: "idx_warehouse", columns: ["warehouse"] },
        ],
      },
      {
        table_name: "tblmasterwarehouse",
        description: "Warehouse master table",
        primary_key: "id",
        columns: [
          { name: "id", type: "int", pk: true },
          { name: "company_id", type: "int" },
          { name: "warehouse_name", type: "string" },
          { name: "warehouse_code", type: "string" },
          { name: "country", type: "string" },
          { name: "city", type: "string" },
          { name: "state", type: "string" },
          { name: "zipcode", type: "string" },
          { name: "status", type: "int" },
          { name: "created_at", type: "datetime" },
          { name: "updated_at", type: "datetime" },
        ],
        indexes: [{ name: "idx_company", columns: ["company_id"] }],
      },
      {
        table_name: "master_inventory",
        description: "Inventory and stock tracking table",
        primary_key: "id",
        columns: [
          { name: "id", type: "int", pk: true },
          { name: "description", type: "string" },
          { name: "rate", type: "decimal" },
          { name: "selling_price", type: "decimal" },
          { name: "warehouse", type: "int", fk: "tblmasterwarehouse.id" },
          { name: "lotno", type: "string" },
          { name: "mfg_date", type: "datetime" },
          { name: "exp_date", type: "datetime" },
          { name: "total_available_qty", type: "decimal" },
          { name: "reserved", type: "decimal" },
          { name: "company_id", type: "int" },
          { name: "created_at", type: "timestamp" },
        ],
        indexes: [
          { name: "idx_company_lot", columns: ["company_id", "lotno"] },
          { name: "idx_qty", columns: ["total_available_qty"] },
        ],
      },
    ],
    relationships: [
      { from: "sales_master.clientid", to: "tblcompanies.userid", type: "many-to-one" },
      { from: "sales_items.salesorderid", to: "sales_master.id", type: "many-to-one" },
      { from: "sales_items.warehouse", to: "tblmasterwarehouse.id", type: "many-to-one" },
      { from: "sales_items.inventory_id", to: "master_inventory.id", type: "many-to-one" },
    ],
  };

  const loadSample = () => {
    loadSchema(SAMPLE_SCHEMA, "sample_erp_schema.json");
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-950 p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-5 shadow-lg shadow-blue-600/30">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-white stroke-2">
              <rect x="2" y="3" width="8" height="6" rx="1" />
              <rect x="14" y="3" width="8" height="6" rx="1" />
              <rect x="2" y="15" width="8" height="6" rx="1" />
              <rect x="14" y="15" width="8" height="6" rx="1" />
              <path d="M10 6h4M10 18h4M6 9v6M18 9v6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ER Diagram Canvas</h1>
          <p className="text-gray-400 text-base">
            Upload your database schema JSON to visualize tables, relationships, and structure interactively.
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
              : "border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800/60"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Parsing schema...</p>
            </div>
          ) : (
            <>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${dragging ? "bg-blue-500/20" : "bg-gray-800"}`}>
                <Upload className={`w-7 h-7 transition-colors ${dragging ? "text-blue-400" : "text-gray-400"}`} />
              </div>
              <p className="text-white font-semibold text-lg mb-1">
                {dragging ? "Drop your JSON file here" : "Drag & drop your schema JSON"}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                or <span className="text-blue-400 hover:text-blue-300">click to browse</span>
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
                <FileJson className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-500">Supports .json files with tables + relationships</span>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-950/60 border border-red-800">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs mb-2">Don't have a file? Try the sample schema</p>
          <button
            onClick={loadSample}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-gray-700 hover:text-white transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Load Sample ERP Schema
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: "🗂️", title: "JSON Schema", desc: "Must include tables array with columns" },
            { icon: "🔗", title: "Relationships", desc: "Include from/to field with FK references" },
            { icon: "📦", title: "Modules", desc: "Auto-detected from table names" },
          ].map((item) => (
            <div key={item.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-white text-xs font-semibold mb-1">{item.title}</p>
              <p className="text-gray-500 text-[11px]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
