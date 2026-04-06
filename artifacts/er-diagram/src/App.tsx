import Sidebar from "./components/Sidebar";
import Filters from "./components/Filters";
import ERCanvas from "./components/ERCanvas";
import DetailsPanel from "./components/DetailsPanel";
import { erSchema } from "./data/schema";

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950">
      <header className="flex items-center gap-3 px-5 py-3 bg-gray-950 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-white fill-none stroke-white stroke-2">
              <rect x="2" y="3" width="8" height="6" rx="1" />
              <rect x="14" y="3" width="8" height="6" rx="1" />
              <rect x="2" y="15" width="8" height="6" rx="1" />
              <rect x="14" y="15" width="8" height="6" rx="1" />
              <path d="M10 6h4M10 18h4M6 9v6M18 9v6" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">ER Diagram Canvas</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {erSchema.database} · v{erSchema.version}
            </p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {[
              { color: "bg-violet-500", label: "Company" },
              { color: "bg-blue-500", label: "Sales" },
              { color: "bg-emerald-500", label: "Inventory" },
              { color: "bg-amber-500", label: "Warehouse" },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800">
                <div className={`w-2 h-2 rounded-full ${m.color}`} />
                <span className="text-[11px] text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <Filters />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ERCanvas />
        <DetailsPanel />
      </div>
    </div>
  );
}
