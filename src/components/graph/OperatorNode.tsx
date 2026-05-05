"use client";
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { RelAlgNode } from "@/types";

interface OperatorNodeProps {
  data: { label: string; kind: RelAlgNode["kind"] };
}

const KIND_STYLES: Record<
  RelAlgNode["kind"],
  { bg: string; border: string; icon: string; textColor: string }
> = {
  relation:   { bg: "var(--surface-2)", border: "#22d3ee", icon: "⬛", textColor: "#22d3ee" },
  selection:  { bg: "var(--surface-2)", border: "#6366f1", icon: "σ",  textColor: "#6366f1" },
  projection: { bg: "var(--surface-2)", border: "#10b981", icon: "π",  textColor: "#10b981" },
  join:       { bg: "var(--surface-2)", border: "#f59e0b", icon: "⋈",  textColor: "#f59e0b" },
};

export const OperatorNode = memo(({ data }: OperatorNodeProps) => {
  const style = KIND_STYLES[data.kind];

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: style.border, width: 8, height: 8 }}
      />
      <div
        style={{
          background: style.bg,
          border: `1.5px solid ${style.border}`,
          borderRadius: 8,
          padding: "8px 14px",
          minWidth: 160,
          maxWidth: 240,
          boxShadow: `0 0 12px ${style.border}33`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 18,
            lineHeight: 1,
            color: style.textColor,
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
          }}
        >
          {style.icon}
        </span>
        <span
          style={{
            fontSize: 11,
            color: style.textColor,
            fontFamily: "'JetBrains Mono', monospace",
            wordBreak: "break-word",
            lineHeight: 1.4,
          }}
        >
          {data.label}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: style.border, width: 8, height: 8 }}
      />
    </>
  );
});

OperatorNode.displayName = "OperatorNode";
