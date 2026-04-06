import { Node, Edge } from "reactflow";
import dagre from "@dagrejs/dagre";
import { Table, Relationship } from "../data/schema";

const NODE_WIDTH = 280;
const NODE_HEIGHT_BASE = 80;
const ROW_HEIGHT = 28;

export function buildNodesAndEdges(
  tables: Table[],
  relationships: Relationship[],
  highlightedTable: string | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = tables.map((table) => {
    const isHighlighted = highlightedTable
      ? highlightedTable === table.table_name
      : false;
    const isConnected = highlightedTable
      ? relationships.some(
          (r) =>
            r.from.split(".")[0] === highlightedTable &&
            r.to.split(".")[0] === table.table_name ||
            r.to.split(".")[0] === highlightedTable &&
            r.from.split(".")[0] === table.table_name
        )
      : false;

    return {
      id: table.table_name,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: {
        table,
        isHighlighted,
        isConnected,
        isDimmed: highlightedTable !== null && !isHighlighted && !isConnected,
      },
    };
  });

  const edges: Edge[] = relationships
    .filter(
      (rel) =>
        tables.some((t) => t.table_name === rel.from.split(".")[0]) &&
        tables.some((t) => t.table_name === rel.to.split(".")[0])
    )
    .map((rel, i) => {
      const sourceTable = rel.from.split(".")[0];
      const targetTable = rel.to.split(".")[0];
      const isEdgeHighlighted =
        highlightedTable !== null &&
        (sourceTable === highlightedTable || targetTable === highlightedTable);

      return {
        id: `edge-${i}`,
        source: sourceTable,
        target: targetTable,
        type: "smoothstep",
        animated: isEdgeHighlighted,
        label: rel.type,
        labelStyle: { fontSize: 10, fill: "#64748b" },
        labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.85 },
        style: {
          stroke: isEdgeHighlighted
            ? "#3b82f6"
            : highlightedTable
            ? "#cbd5e1"
            : "#3b82f6",
          strokeWidth: isEdgeHighlighted ? 2 : 1.5,
          opacity: highlightedTable && !isEdgeHighlighted ? 0.2 : 1,
        },
        markerEnd: {
          type: "arrowclosed",
          color: isEdgeHighlighted
            ? "#3b82f6"
            : highlightedTable
            ? "#cbd5e1"
            : "#3b82f6",
        },
      };
    });

  const layouted = applyDagreLayout(nodes, edges, tables);

  return { nodes: layouted, edges };
}

function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  tables: Table[]
): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    ranksep: 120,
    nodesep: 60,
    edgesep: 30,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    const table = tables.find((t) => t.table_name === node.id);
    const height = table
      ? NODE_HEIGHT_BASE + table.columns.length * ROW_HEIGHT
      : NODE_HEIGHT_BASE;
    g.setNode(node.id, { width: NODE_WIDTH, height });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const nodeWithPos = g.node(node.id);
    const table = tables.find((t) => t.table_name === node.id);
    const height = table
      ? NODE_HEIGHT_BASE + table.columns.length * ROW_HEIGHT
      : NODE_HEIGHT_BASE;
    return {
      ...node,
      position: {
        x: nodeWithPos.x - NODE_WIDTH / 2,
        y: nodeWithPos.y - height / 2,
      },
    };
  });
}
