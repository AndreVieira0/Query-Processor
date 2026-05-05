// ============================================================
// CONVERSOR RelAlgNode → React Flow Nodes/Edges (HU3)
// ============================================================

import type { RelAlgNode } from "@/types";
import dagre from "dagre";

export interface FlowNode {
  id: string;
  type: string;
  data: { label: string; kind: RelAlgNode["kind"] };
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  style?: object;
}

// Layout automático usando Dagre (top-down)
function layoutGraph(
  nodes: FlowNode[],
  edges: FlowEdge[]
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });

  for (const node of nodes) {
    g.setNode(node.id, { width: 200, height: 60 });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const n = g.node(node.id);
    return {
      ...node,
      position: { x: n.x - 100, y: n.y - 30 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Percurso recursivo
function collectNodesEdges(
  node: RelAlgNode,
  flowNodes: FlowNode[],
  flowEdges: FlowEdge[]
) {
  flowNodes.push({
    id: node.id,
    type: "operatorNode",
    data: { label: node.label, kind: node.kind },
    position: { x: 0, y: 0 }, // será calculado pelo dagre
  });

  for (const child of node.children) {
    collectNodesEdges(child, flowNodes, flowEdges);
    flowEdges.push({
      id: `e_${node.id}_${child.id}`,
      source: node.id,
      target: child.id,
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
    });
  }
}

export function buildFlowGraph(root: RelAlgNode): {
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const flowNodes: FlowNode[] = [];
  const flowEdges: FlowEdge[] = [];
  collectNodesEdges(root, flowNodes, flowEdges);
  return layoutGraph(flowNodes, flowEdges);
}
