import { useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { toPng, toSvg } from "html-to-image";
import { useStore, getFilteredTables, getActiveRelationships } from "../store/useStore";
import { useSchema } from "../context/SchemaContext";
import { buildNodesAndEdges } from "../utils/graphBuilder";
import TableNode from "./TableNode";
import { Download, RefreshCw, Database } from "lucide-react";

const nodeTypes = { tableNode: TableNode };

function ERCanvasInner() {
  const { schema } = useSchema();
  const {
    selectedTables, searchQuery, relationshipFilter,
    showOrphans, showOnlyConnected, highlightedTableName,
  } = useStore();

  const tables = schema?.tables ?? [];
  const relationships = schema?.relationships ?? [];

  const activeRels = getActiveRelationships(relationships, selectedTables, relationshipFilter);
  const filteredTables = getFilteredTables(tables, selectedTables, searchQuery, activeRels, showOnlyConnected, showOrphans);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const flowRef = useRef<HTMLDivElement>(null);

  const prevKey = useRef("");
  const prevHighlight = useRef<string | null>(null);

  const tableKey = filteredTables.map((t) => t.table_name).join(",");
  const relKey = activeRels.map((r) => `${r.from}-${r.to}`).join(",");
  const currentKey = `${tableKey}|${relKey}`;

  if (prevKey.current !== currentKey || prevHighlight.current !== highlightedTableName) {
    prevKey.current = currentKey;
    prevHighlight.current = highlightedTableName;
    const { nodes: n, edges: e } = buildNodesAndEdges(filteredTables, activeRels, highlightedTableName);
    setNodes(n);
    setEdges(e);
  }

  const rebuildGraph = useCallback(() => {
    const { nodes: n, edges: e } = buildNodesAndEdges(filteredTables, activeRels, highlightedTableName);
    setNodes(n);
    setEdges(e);
  }, [filteredTables, activeRels, highlightedTableName, setNodes, setEdges]);

  const exportPng = useCallback(() => {
    if (!flowRef.current) return;
    const el = flowRef.current.querySelector(".react-flow__viewport") as HTMLElement;
    if (!el) return;
    toPng(el, { backgroundColor: "#f8fafc", quality: 1 }).then((dataUrl) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "er-diagram.png";
      a.click();
    });
  }, []);

  const exportSvg = useCallback(() => {
    if (!flowRef.current) return;
    const el = flowRef.current.querySelector(".react-flow__viewport") as HTMLElement;
    if (!el) return;
    toSvg(el, { backgroundColor: "#f8fafc" }).then((dataUrl) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "er-diagram.svg";
      a.click();
    });
  }, []);

  if (filteredTables.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tables selected</p>
          <p className="text-sm text-gray-400">Select tables from the sidebar to visualize them</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative" ref={flowRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e2e8f0" gap={24} size={1.5} />
        <Controls className="!bg-white !border !border-gray-200 !shadow-md !rounded-xl overflow-hidden" />
        <MiniMap
          nodeColor={(node) => {
            const table = filteredTables.find((t) => t.table_name === node.id);
            if (!table) return "#94a3b8";
            const colors: Record<string, string> = {
              company: "#7c3aed", sales: "#2563eb", inventory: "#059669",
              warehouse: "#d97706", finance: "#e11d48", hr: "#db2777",
              logistics: "#0891b2", crm: "#4f46e5",
            };
            return colors[table.module ?? ""] ?? "#64748b";
          }}
          className="!bg-white !border !border-gray-200 !shadow-md !rounded-xl overflow-hidden"
        />
        <Panel position="top-right">
          <div className="flex gap-2">
            <button
              onClick={rebuildGraph}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Layout
            </button>
            <button
              onClick={exportPng}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PNG
            </button>
            <button
              onClick={exportSvg}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              SVG
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function ERCanvas() {
  return (
    <ReactFlowProvider>
      <ERCanvasInner />
    </ReactFlowProvider>
  );
}
