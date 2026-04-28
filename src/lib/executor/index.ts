// ============================================================
// GERADOR DE PLANO DE EXECUÇÃO (HU5)
// Percorre a árvore otimizada em post-order (folhas → raiz)
// e gera os passos de execução ordenados
// ============================================================

import type { RelAlgNode, ExecutionStep } from "@/types";

let stepCounter = 0;

function operationName(kind: RelAlgNode["kind"]): string {
  switch (kind) {
    case "relation": return "Leitura de Tabela";
    case "selection": return "Seleção (σ)";
    case "projection": return "Projeção (π)";
    case "join": return "Junção (⋈)";
  }
}

function operationDescription(node: RelAlgNode): string {
  switch (node.kind) {
    case "relation":
      return `Ler todos os registros da tabela '${node.label}'`;
    case "selection":
      return `Filtrar tuplas onde: ${node.condition}`;
    case "projection":
      return `Projetar atributos: ${node.label.replace("π  ", "")}`;
    case "join":
      return `Realizar junção com condição: ${node.condition}`;
  }
}

function costHint(kind: RelAlgNode["kind"]): string {
  switch (kind) {
    case "relation": return "I/O";
    case "selection": return "Linear";
    case "projection": return "Linear";
    case "join": return "Quadrática (sem índice)";
  }
}

// Percurso post-order: filhos antes do pai
function traverse(node: RelAlgNode, steps: ExecutionStep[]) {
  for (const child of node.children) {
    traverse(child, steps);
  }

  const step: ExecutionStep = {
    order: ++stepCounter,
    operation: operationName(node.kind),
    description: operationDescription(node),
    cost: costHint(node.kind),
  };

  steps.push(step);
}

export function generateExecutionPlan(optimizedRoot: RelAlgNode): ExecutionStep[] {
  stepCounter = 0;
  const steps: ExecutionStep[] = [];
  traverse(optimizedRoot, steps);
  return steps;
}
