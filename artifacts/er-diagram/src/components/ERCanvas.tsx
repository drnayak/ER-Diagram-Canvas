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

function applyHighlightToNodes(
  nodes: Node[],
  edges: Edge[],
  highlightedTableName: string | null,
  activeRels: Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  const updatedNodes = nodes.map((node) => {
    const isHighlighted = highlightedTableName === node.id;
    const isConnected = highlightedTableName
      ? activeRels.some(
          (r) =>
            (r.from.split(".")[0] === highlightedTableName && r.to.split(".")[0] === node.id) ||
            (r.to.split(".")[0] === highlightedTableName && r.from.split(".")[0] === node.id)
        )
      : false;
    return {
      ...node,
      data: {
        ...node.data,
        isHighlighted,
        isConnected,
        isDimmed: highlightedTableName !== null && !isHighlighted && !isConnected,
      },
    };
  });

  const updatedEdges = edges.map((edge) => {
    const isEdgeHighlighted =
      highlightedTableName !== null &&
      (edge.source === highlightedTableName || edge.target === highlightedTableName);
    return {
      ...edge,
      animated: isEdgeHighlighted,
      style: {
        stroke: isEdgeHighlighted ? "#3b82f6" : highlightedTableName ? "#94a3b8" : "#3b82f6",
        strokeWidth: isEdgeHighlighted ? 2.5 : 1.5,
        opacity: highlightedTableName && !isEdgeHighlighted ? 0.15 : 1,
      },
      markerEnd: {
        type: "arrowclosed",
        color: isEdgeHighlighted ? "#3b82f6" : highlightedTableName ? "#94a3b8" : "#3b82f6",
      },
    };
  });

  return { nodes: updatedNodes, edges: updatedEdges };
}

interface ERCanvasInnerProps {
  sidebarOpen: boolean;
}

function ERCanvasInner({ sidebarOpen }: ERCanvasInnerProps) {
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

  // Stable refs so effect callbacks always see current values
  const activeRelsRef = useRef(activeRels);
  activeRelsRef.current = activeRels;

  // Keys to detect when layout needs a full rebuild (table set or relationship set changed)
  const tableKey = filteredTables.map((t) => t.table_name).sort().join(",");
  const relKey = activeRels.map((r) => `${r.from}>${r.to}`).sort().join(",");
  const layoutKey = `${tableKey}||${relKey}`;
  const prevLayoutKey = useRef("");

  // Effect 1: Full layout rebuild ONLY when the set of tables/rels changes.
  // This preserves positions across all other state changes (hover, filter toggles that don't add/remove tables).
  useEffect(() => {
    if (prevLayoutKey.current === layoutKey) return;
    prevLayoutKey.current = layoutKey;

    const { nodes: n, edges: e } = buildNodesAndEdges(filteredTables, activeRels, null);
    const { nodes: hn, edges: he } = applyHighlightToNodes(n, e, highlightedTableName, activeRelsRef.current);
    setNodes(hn);
    setEdges(he);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  // Effect 2: Update highlight/dim WITHOUT touching positions (preserves drag).
  useEffect(() => {
    setNodes((prev) => {
      const updated = applyHighlightToNodes(prev, [], highlightedTableName, activeRelsRef.current).nodes;
      return updated;
    });
    setEdges((prev) => {
      const updated = applyHighlightToNodes([], prev, highlightedTableName, activeRelsRef.current).edges;
      return updated;
    });
  }, [highlightedTableName, setNodes, setEdges]);

  const rebuildGraph = useCallback(() => {
    prevLayoutKey.current = ""; // force reset
    const { nodes: n, edges: e } = buildNodesAndEdges(filteredTables, activeRelsRef.current, null);
    const { nodes: hn, edges: he } = applyHighlightToNodes(n, e, highlightedTableName, activeRelsRef.current);
    setNodes(hn);
    setEdges(he);
  }, [filteredTables, highlightedTableName, setNodes, setEdges]);

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
        nodesDraggable
        elementsSelectable
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
