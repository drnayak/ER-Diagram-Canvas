import { useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { toPng, toSvg } from "html-to-image";
import { useStore, getFilteredTables, getActiveRelationships } from "../store/useStore";
import { useSchema } from "../context/SchemaContext";
import { buildNodesAndEdges } from "../utils/graphBuilder";
import { Relationship } from "../types";
import TableNode from "./TableNode";
import { Download, RefreshCw, Database } from "lucide-react";

const nodeTypes = { tableNode: TableNode };

// Compute all visual state (hover highlight + relationship selection) without touching positions
function applyVisualState(
  nodes: Node[],
  edges: Edge[],
  highlightedTableName: string | null,
  selectedRelationship: Relationship | null,
  activeRels: Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  const selFromTable = selectedRelationship?.from.split(".")[0] ?? null;
  const selToTable = selectedRelationship?.to.split(".")[0] ?? null;
  const selFromCol = selectedRelationship?.from.split(".")[1] ?? null;
  const selToCol = selectedRelationship?.to.split(".")[1] ?? null;

  const updatedNodes = nodes.map((node) => {
    const isHighlighted = highlightedTableName === node.id;
    const isConnected = highlightedTableName
      ? activeRels.some(
          (r) =>
            (r.from.split(".")[0] === highlightedTableName && r.to.split(".")[0] === node.id) ||
            (r.to.split(".")[0] === highlightedTableName && r.from.split(".")[0] === node.id)
        )
      : false;

    // Columns referenced by the selected relationship in this table
    const relHighlightedCols = new Set<string>();
    if (selectedRelationship) {
      if (node.id === selFromTable && selFromCol) relHighlightedCols.add(selFromCol);
      if (node.id === selToTable && selToCol) relHighlightedCols.add(selToCol);
    }

    return {
      ...node,
      data: {
        ...node.data,
        isHighlighted,
        isConnected,
        isDimmed: highlightedTableName !== null && !isHighlighted && !isConnected,
        relHighlightedCols,
      },
    };
  });

  const updatedEdges = edges.map((edge) => {
    const isHoverHighlighted =
      highlightedTableName !== null &&
      (edge.source === highlightedTableName || edge.target === highlightedTableName);
    const isSelected =
      selectedRelationship !== null &&
      edge.source === selFromTable &&
      edge.target === selToTable;

    let stroke = "#3b82f6";
    if (isSelected) stroke = "#f97316";
    else if (isHoverHighlighted) stroke = "#3b82f6";
    else if (highlightedTableName) stroke = "#94a3b8";

    return {
      ...edge,
      animated: isSelected || isHoverHighlighted,
      style: {
        stroke,
        strokeWidth: isSelected ? 3 : isHoverHighlighted ? 2.5 : 1.5,
        opacity: (highlightedTableName && !isHoverHighlighted && !isSelected) ? 0.12 : 1,
      },
      markerEnd: { type: "arrowclosed", color: stroke },
    };
  });

  return { nodes: updatedNodes, edges: updatedEdges };
}

function ERCanvasInner({ sidebarOpen }: { sidebarOpen: boolean }) {
  const { schema } = useSchema();
  const {
    selectedTables, searchQuery, relationshipFilter,
    showOrphans, showOnlyConnected,
    highlightedTableName, selectedRelationship,
    setSelectedRelationship, setSelectedTableName,
  } = useStore();

  const tables = schema?.tables ?? [];
  const relationships = schema?.relationships ?? [];

  const activeRels = getActiveRelationships(relationships, selectedTables, relationshipFilter);
  const filteredTables = getFilteredTables(tables, selectedTables, searchQuery, activeRels, showOnlyConnected, showOrphans);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const flowRef = useRef<HTMLDivElement>(null);

  const activeRelsRef = useRef(activeRels);
  activeRelsRef.current = activeRels;
  const highlightedRef = useRef(highlightedTableName);
  highlightedRef.current = highlightedTableName;
  const selectedRelRef = useRef(selectedRelationship);
  selectedRelRef.current = selectedRelationship;

  const tableKey = filteredTables.map((t) => t.table_name).sort().join(",");
  const relKey = activeRels.map((r) => `${r.from}>${r.to}`).sort().join(",");
  const layoutKey = `${tableKey}||${relKey}`;
  const prevLayoutKey = useRef("");

  // Effect 1: Full layout rebuild only when table set / rel set changes
  useEffect(() => {
    if (prevLayoutKey.current === layoutKey) return;
    prevLayoutKey.current = layoutKey;
    const { nodes: n, edges: e } = buildNodesAndEdges(filteredTables, activeRels, null);
    const { nodes: vn, edges: ve } = applyVisualState(n, e, highlightedRef.current, selectedRelRef.current, activeRelsRef.current);
    setNodes(vn);
    setEdges(ve);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  // Effect 2: Visual-only update when hover or selected relationship changes (preserves positions)
  useEffect(() => {
    setNodes((prev) => applyVisualState(prev, [], highlightedTableName, selectedRelationship, activeRelsRef.current).nodes);
    setEdges((prev) => applyVisualState([], prev, highlightedTableName, selectedRelationship, activeRelsRef.current).edges);
  }, [highlightedTableName, selectedRelationship, setNodes, setEdges]);

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      // Find the full relationship object from active relationships
      const rel = activeRelsRef.current.find(
        (r) => r.from.split(".")[0] === edge.source && r.to.split(".")[0] === edge.target
      );
      if (rel) setSelectedRelationship(rel);
    },
    [setSelectedRelationship]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedRelationship(null);
    setSelectedTableName(null);
  }, [setSelectedRelationship, setSelectedTableName]);

  const rebuildGraph = useCallback(() => {
    prevLayoutKey.current = "";
    const { nodes: n, edges: e } = buildNodesAndEdges(filteredTables, activeRelsRef.current, null);
    const { nodes: vn, edges: ve } = applyVisualState(n, e, highlightedRef.current, selectedRelRef.current, activeRelsRef.current);
    setNodes(vn);
    setEdges(ve);
  }, [filteredTables, setNodes, setEdges]);

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
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        elementsSelectable={false}
      >
        <Background color="#e2e8f0" gap={24} size={1.5} />
        <Controls className="!bg-white !border !border-gray-200 !shadow-md !rounded-xl overflow-hidden" />
        <Panel position="top-right">
          <div className="flex gap-2">
            <button
              onClick={rebuildGraph}
              title="Reset to auto-layout"
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

export default function ERCanvas({ sidebarOpen }: { sidebarOpen: boolean }) {
  return (
    <ReactFlowProvider>
      <ERCanvasInner sidebarOpen={sidebarOpen} />
    </ReactFlowProvider>
  );
}
