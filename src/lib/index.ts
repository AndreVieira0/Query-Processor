// ============================================================
// ORQUESTRADOR PRINCIPAL
// Conecta: Parser → Álgebra → Otimizador → Grafo → Plano
// ============================================================

import { parseSQL } from "./parser";
import { buildRelAlgTree, treeToExpression } from "./algebra";
import { optimizeTree } from "./optimizer";
import { generateExecutionPlan } from "./executor";
import type { ProcessResult } from "@/types";

export function processQuery(sql: string): ProcessResult {
  // HU1 – Parse + validação
  const parseResult = parseSQL(sql);

  if (!parseResult.success || !parseResult.ast) {
    return {
      parseResult,
      relationalAlgebra: "",
      relAlgTree: null,
      optimizedTree: null,
      executionPlan: [],
    };
  }

  // HU2 – Álgebra relacional
  const relAlgTree = buildRelAlgTree(parseResult.ast);
  const relationalAlgebra = treeToExpression(relAlgTree);

  // HU4 – Otimização
  const optimizedTree = optimizeTree(relAlgTree);

  // HU5 – Plano de execução
  const executionPlan = generateExecutionPlan(optimizedTree);

  return {
    parseResult,
    relationalAlgebra,
    relAlgTree,
    optimizedTree,
    executionPlan,
  };
}

export { buildFlowGraph } from "./graph";
export type { FlowNode, FlowEdge } from "./graph";
