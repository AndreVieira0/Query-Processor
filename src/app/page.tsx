"use client";
import { useState, useCallback } from "react";
import type { ProcessResult } from "@/types";
import { processQuery } from "@/lib";
import {
  SqlInput,
  ErrorsPanel,
  AlgebraPanel,
  ExecutionPlanPanel,
  SuccessBadge,
} from "@/components/ui/panels";
import { GraphPanel } from "@/components/graph/GraphPanel";

type Tab = "algebra" | "graph" | "graph-opt" | "plan";

export default function Home() {
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("graph-opt");

  const handleProcess = useCallback((sql: string) => {
    setLoading(true);
    // Simula tick async para que o loading apareça
    setTimeout(() => {
      const r = processQuery(sql);
      setResult(r);
      setLoading(false);
    }, 60);
  }, []);

  const TABS: Array<{ id: Tab; label: string; icon: string }> = [
    { id: "algebra", label: "Álgebra Relacional", icon: "∑" },
    { id: "graph", label: "Grafo Original", icon: "◈" },
    { id: "graph-opt", label: "Grafo Otimizado", icon: "◈ ✦" },
    { id: "plan", label: "Plano de Execução", icon: "⚡" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          height: 60,
          gap: 16,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: "var(--accent)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            boxShadow: "0 0 16px var(--accent-glow)",
          }}
        >
          ⬡
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: "0.04em",
              color: "var(--text)",
            }}
          >
            PROCESSADOR DE CONSULTAS
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.06em",
            }}
          >
            Banco de Dados · SQL → Álgebra Relacional → Grafo de Operadores
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* Legend */}
          {[
            { color: "#22d3ee", label: "Relação" },
            { color: "#6366f1", label: "Seleção σ" },
            { color: "#10b981", label: "Projeção π" },
            { color: "#f59e0b", label: "Junção ⋈" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
              />
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Main layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left sidebar: input + results text */}
        <div
          style={{
            width: 420,
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 0,
            overflowY: "auto",
            padding: "20px 20px",
            background: "var(--surface)",
          }}
        >
          <SqlInput onProcess={handleProcess} loading={loading} />

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              {result.parseResult.success ? (
                <SuccessBadge />
              ) : (
                <ErrorsPanel errors={result.parseResult.errors} />
              )}

              {result.parseResult.success && result.relationalAlgebra && (
                <AlgebraPanel expression={result.relationalAlgebra} />
              )}

              {result.parseResult.success && result.executionPlan.length > 0 && (
                <ExecutionPlanPanel plan={result.executionPlan} />
              )}
            </div>
          )}

          {!result && (
            <div
              style={{
                marginTop: 24,
                padding: 20,
                background: "var(--surface-2)",
                border: "1px dashed var(--border)",
                borderRadius: "var(--radius)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>⬡</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Digite uma consulta SQL e clique em{" "}
                <strong style={{ color: "var(--accent)" }}>Processar</strong> para visualizar
                a álgebra relacional e o grafo de operadores.
              </div>
            </div>
          )}
        </div>

        {/* Right area: graph/tabs */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)",
              padding: "0 16px",
              gap: 2,
            }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "14px 18px",
                    background: "transparent",
                    border: "none",
                    borderBottom: active
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                    color: active ? "var(--text)" : "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "color 0.15s",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span style={{ color: active ? "var(--accent)" : "var(--text-dim)" }}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {!result || !result.parseResult.success ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 16,
                  color: "var(--text-dim)",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "2px dashed var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    color: "var(--border)",
                  }}
                >
                  ◈
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {result && !result.parseResult.success
                    ? "Corrija os erros de validação para ver o grafo"
                    : "Aguardando consulta SQL..."}
                </span>
              </div>
            ) : (
              <>
                {activeTab === "graph" && result.relAlgTree && (
                  <GraphPanel root={result.relAlgTree} title="Grafo de Operadores (Não Otimizado)" />
                )}
                {activeTab === "graph-opt" && result.optimizedTree && (
                  <GraphPanel root={result.optimizedTree} title="Grafo de Operadores (Otimizado)" />
                )}
                {activeTab === "algebra" && (
                  <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
                    <AlgebraPanel expression={result.relationalAlgebra} />
                  </div>
                )}
                {activeTab === "plan" && (
                  <div style={{ padding: 24, overflowY: "auto", height: "100%" }}>
                    <ExecutionPlanPanel plan={result.executionPlan} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
