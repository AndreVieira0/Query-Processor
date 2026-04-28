"use client";
import { useState, useCallback } from "react";
import type { ProcessResult } from "@/types";

// ---- SQL Input ----
interface SqlInputProps {
  onProcess: (sql: string) => void;
  loading?: boolean;
}

const EXAMPLE_QUERIES = [
  `SELECT Cliente.Nome, Pedido.DataPedido
FROM Cliente
JOIN Pedido ON Pedido.Cliente_idCliente = Cliente.idCliente
WHERE Pedido.ValorTotalPedido > 100`,
  `SELECT Produto.Nome, Produto.Preco, Categoria.Descricao
FROM Produto
JOIN Categoria ON Produto.Categoria_idCategoria = Categoria.idCategoria
WHERE Produto.Preco >= 50`,
  `SELECT Cliente.Nome, Produto.Nome, Pedido_has_Produto.Quantidade
FROM Cliente
JOIN Pedido ON Pedido.Cliente_idCliente = Cliente.idCliente
JOIN Pedido_has_Produto ON Pedido_has_Produto.Pedido_idPedido = Pedido.idPedido
JOIN Produto ON Pedido_has_Produto.Produto_idProduto = Produto.idProduto
WHERE Pedido_has_Produto.Quantidade > 2`,
];

export function SqlInput({ onProcess, loading }: SqlInputProps) {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0]);

  const handleExample = (q: string) => setQuery(q);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
          SQL
        </span>
        <span style={{ color: "var(--text-dim)", fontSize: 12 }}>›</span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Entrada da Consulta</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => handleExample(EXAMPLE_QUERIES[i])}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                padding: "3px 10px",
                borderRadius: 4,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.borderColor = "var(--accent)";
                (e.target as HTMLElement).style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.borderColor = "var(--border)";
                (e.target as HTMLElement).style.color = "var(--text-muted)";
              }}
            >
              Ex {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={7}
        placeholder="Digite sua consulta SQL..."
        spellCheck={false}
        style={{
          width: "100%",
          padding: "16px",
          background: "var(--surface)",
          color: "var(--text)",
          border: "none",
          outline: "none",
          resize: "vertical",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          lineHeight: 1.7,
          letterSpacing: "0.02em",
        }}
      />

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => onProcess(query)}
          disabled={loading || !query.trim()}
          style={{
            background: loading ? "var(--surface-3)" : "var(--accent)",
            color: "#fff",
            border: "none",
            padding: "10px 28px",
            borderRadius: "var(--radius)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "0.05em",
            transition: "all 0.15s",
            boxShadow: loading ? "none" : "0 0 20px var(--accent-glow)",
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.target as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          {loading ? "Processando..." : "▶  Processar Consulta"}
        </button>
      </div>
    </div>
  );
}

// ---- Errors Panel ----
export function ErrorsPanel({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div
      style={{
        background: "#1a0810",
        border: "1px solid var(--error)",
        borderRadius: "var(--radius)",
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          color: "var(--error)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ✖ Erros de Validação ({errors.length})
      </div>
      <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
        {errors.map((e, i) => (
          <li
            key={i}
            style={{
              color: "#fb7185",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              lineHeight: 1.6,
              paddingLeft: 16,
              borderLeft: "2px solid var(--error)",
            }}
          >
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Relational Algebra Panel ----
export function AlgebraPanel({ expression }: { expression: string }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "#10b981", fontSize: 14 }}>∑</span>
        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Álgebra Relacional
        </span>
      </div>
      <div
        style={{
          padding: "16px",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "#a5b4fc",
          lineHeight: 1.8,
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {expression}
      </div>
    </div>
  );
}

// ---- Execution Plan Panel ----
export function ExecutionPlanPanel({ plan }: { plan: ProcessResult["executionPlan"] }) {
  const STEP_COLORS: Record<string, string> = {
    "Leitura de Tabela": "#22d3ee",
    "Seleção (σ)": "#6366f1",
    "Projeção (π)": "#10b981",
    "Junção (⋈)": "#f59e0b",
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "#f59e0b" }}>⚡</span>
        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Plano de Execução
        </span>
        <span
          style={{
            marginLeft: "auto",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 4,
            fontFamily: "var(--font-mono)",
          }}
        >
          {plan.length} passos
        </span>
      </div>
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {plan.map((step) => {
          const color = STEP_COLORS[step.operation] ?? "#fff";
          return (
            <div
              key={step.order}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                background: "var(--surface-2)",
                border: `1px solid ${color}33`,
                borderRadius: "var(--radius)",
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: `${color}22`,
                  border: `1.5px solid ${color}`,
                  color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {step.order}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  {step.operation}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
                  {step.description}
                </div>
                <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 4 }}>
                  Custo estimado: {step.cost}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Success Badge ----
export function SuccessBadge() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#0a1f15",
        border: "1px solid var(--success)",
        color: "#6ee7b7",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontFamily: "var(--font-mono)",
      }}
    >
      ✓ Consulta válida
    </div>
  );
}
