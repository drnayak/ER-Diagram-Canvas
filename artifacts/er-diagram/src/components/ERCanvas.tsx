import { useCallback, useMemo, useRef } from "react";
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
import { useStore } from "../store/useStore";
import { buildNodesAndEdges } from "../utils/graphBuilder";
import TableNode from "./TableNode";
import { Download, RefreshCw, Database } from "lucide-react";

const nodeTypes = { tableNode: TableNode };

function ERCanvasInner() {
  const { getFilteredTables, getActiveRelationships, highlightedTableName } = useStore();

  const filteredTables = getFilteredTables();
  const activeRelationships = getActiveRelationships();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildNodesAndEdges(filteredTables, activeRelationships, highlightedTableName),
    [filteredTables, activeRelationships, highlightedTableName]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const prevTablesRef = useRef<string>("");
  const prevRelRef = useRef<string>("");
  const prevHighlightRef = useRef<string | null>(null);

  const tableKey = filteredTables.map((t) => t.table_name).join(",");
  const relKey = activeRelationships.map((r) => `${r.from}-${r.to}`).join(",");

  if (
    tableKey !== prevTablesRef.current ||
    relKey !== prevRelRef.current
  ) {
    prevTablesRef.current = tableKey;
    prevRelRef.current = relKey;
    prevHighlightRef.current = highlightedTableName;
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(
      filteredTables,
      activeRelationships,
      highlightedTableName
    );
    setNodes(newNodes);
    setEdges(newEdges);
  } else if (prevHighlightRef.current !== highlightedTableName) {
    prevHighlightRef.current = highlightedTableName;
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(
      filteredTables,
      activeRelationships,
      highlightedTableName
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }

  const flowRef = useRef<HTMLDivElement>(null);

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

  const resetLayout = useCallback(() => {
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(
      filteredTables,
      activeRelationships,
      highlightedTableName
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [filteredTables, activeRelationships, highlightedTableName, setNodes, setEdges]);

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
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e2e8f0" gap={24} size={1.5} />
        <Controls className="!bg-white !border !border-gray-200 !shadow-md !rounded-xl overflow-hidden" />
        <MiniMap
          nodeColor={(node) => {
            const table = filteredTables.find(
              (t) => t.table_name === node.id
            );
            if (!table) return "#94a3b8";
            const colors: Record<string, string> = {
              company: "#7c3aed",
              sales: "#2563eb",
              inventory: "#059669",
              warehouse: "#d97706",
            };
            return colors[table.module] ?? "#94a3b8";
          }}
          className="!bg-white !border !border-gray-200 !shadow-md !rounded-xl overflow-hidden"
        />
        <Panel position="top-right">
          <div className="flex gap-2">
            <button
              onClick={resetLayout}
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
