"use client";
import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { OperatorNode } from "./OperatorNode";
import { buildFlowGraph } from "@/lib";
import type { RelAlgNode } from "@/types";

const nodeTypes = { operatorNode: OperatorNode };

interface GraphPanelProps {
  root: RelAlgNode;
  title: string;
}

export function GraphPanel({ root, title }: GraphPanelProps) {
  const { nodes, edges } = useMemo(() => buildFlowGraph(root), [root]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "var(--accent)", fontSize: 12 }}>◈</span>
        <span
          style={{
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--border)"
          />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const kind = (n.data as { kind: RelAlgNode["kind"] }).kind;
              const colors: Record<string, string> = {
                relation: "#22d3ee",
                selection: "#6366f1",
                projection: "#10b981",
                join: "#f59e0b",
              };
              return colors[kind] ?? "#fff";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
