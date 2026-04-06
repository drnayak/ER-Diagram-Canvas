import Sidebar from "./components/Sidebar";
import Filters from "./components/Filters";
import ERCanvas from "./components/ERCanvas";
import DetailsPanel from "./components/DetailsPanel";
import UploadScreen from "./components/UploadScreen";
import { useStore } from "./store/useStore";

function ModuleLegend({ modules }: { modules: string[] }) {
  const colors: Record<string, string> = {
    company: "bg-violet-500", sales: "bg-blue-500",
    inventory: "bg-emerald-500", warehouse: "bg-amber-500",
    finance: "bg-rose-500", hr: "bg-pink-500",
    logistics: "bg-cyan-500", crm: "bg-indigo-500",
    admin: "bg-gray-500", reporting: "bg-teal-500",
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {modules.map((mod) => (
        <div key={mod} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800">
          <div className={`w-2 h-2 rounded-full ${colors[mod] ?? "bg-slate-500"}`} />
          <span className="text-[11px] text-gray-400 capitalize">{mod}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { schema, fileName, clearSchema } = useStore();

  const modules = schema
    ? [...new Set(schema.tables.map((t) => t.module ?? "other"))]
    : [];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
      <header className="flex items-center gap-3 px-5 py-3 bg-gray-950 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-white stroke-2">
              <rect x="2" y="3" width="8" height="6" rx="1" />
              <rect x="14" y="3" width="8" height="6" rx="1" />
              <rect x="2" y="15" width="8" height="6" rx="1" />
              <rect x="14" y="15" width="8" height="6" rx="1" />
              <path d="M10 6h4M10 18h4M6 9v6M18 9v6" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">ER Diagram Canvas</h1>
            {schema ? (
              <p className="text-[10px] text-gray-500 mt-0.5">
                {schema.database ?? "schema"} · {schema.tables.length} tables · {schema.relationships.length} relations
              </p>
            ) : (
              <p className="text-[10px] text-gray-500 mt-0.5">Upload a JSON schema to begin</p>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {schema && (
          <div className="flex items-center gap-3">
            <ModuleLegend modules={modules} />

            <div className="w-px h-5 bg-gray-700" />

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-gray-400 stroke-2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-[11px] text-gray-400 max-w-[140px] truncate">{fileName}</span>
            </div>

            <button
              onClick={clearSchema}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              Upload New
            </button>
          </div>
        )}
      </header>

      {schema ? (
        <>
          <Filters />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <ERCanvas />
            <DetailsPanel />
          </div>
        </>
      ) : (
        <UploadScreen />
      )}
    </div>
  );
}
