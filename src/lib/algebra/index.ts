// ============================================================
// CONVERSOR SQL → ÁLGEBRA RELACIONAL (HU2)
// Gera: árvore RelAlgNode + string de expressão
// ============================================================

import type {
  SelectAST,
  RelAlgNode,
  ConditionNode,
  SelectColumn,
} from "@/types";
import { DB_SCHEMA } from "../parser/schema";

let nodeCounter = 0;
function nextId(prefix: string) {
  return `${prefix}_${++nodeCounter}`;
}

// ---- Converte ConditionNode em string legível ----
export function conditionToString(node: ConditionNode): string {
  if (node.type === "and") {
    return `(${conditionToString(node.left)} ∧ ${conditionToString(node.right)})`;
  }
  const left =
    node.left.type === "column_ref"
      ? node.left.table
        ? `${node.left.table}.${node.left.column}`
        : node.left.column
      : String(node.left.value);

  const right =
    node.right.type === "column_ref"
      ? node.right.table
        ? `${node.right.table}.${node.right.column}`
        : node.right.column
      : `'${node.right.value}'`;

  // mapeia operadores para símbolos
  const opMap: Record<string, string> = {
    "=": "=",
    "<>": "≠",
    ">": ">",
    "<": "<",
    ">=": "≥",
    "<=": "≤",
  };

  return `${left} ${opMap[node.operator] ?? node.operator} ${right}`;
}

// ---- Converte colunas do SELECT em string ----
function columnsToString(cols: SelectColumn[]): string {
  if (cols.length === 1 && cols[0].type === "wildcard") return "*";
  return cols
    .map((c) =>
      c.type === "wildcard"
        ? "*"
        : c.table
        ? `${c.table}.${c.column}`
        : c.column
    )
    .join(", ");
}

// ---- Constrói a árvore RelAlgNode a partir da AST SQL ----
export function buildRelAlgTree(ast: SelectAST): RelAlgNode {
  nodeCounter = 0;

  // 1. Nós folha – tabelas base
  const fromNode: RelAlgNode = {
    id: nextId("R"),
    kind: "relation",
    label: DB_SCHEMA[ast.from.table.toLowerCase()]?.name ?? ast.from.table,
    table: ast.from.table,
    children: [],
  };

  // 2. Constrói a "espinha" de JOINs
  let current: RelAlgNode = fromNode;

  for (const join of ast.joins) {
    const joinTableNode: RelAlgNode = {
      id: nextId("R"),
      kind: "relation",
      label: DB_SCHEMA[join.table.toLowerCase()]?.name ?? join.table,
      table: join.table,
      children: [],
    };

    const condStr = conditionToString(join.on);
    const joinNode: RelAlgNode = {
      id: nextId("J"),
      kind: "join",
      label: `⋈  ${condStr}`,
      condition: condStr,
      children: [current, joinTableNode],
    };

    current = joinNode;
  }

  // 3. Seleção (σ) se existir WHERE
  if (ast.where) {
    const condStr = conditionToString(ast.where);
    current = {
      id: nextId("S"),
      kind: "selection",
      label: `σ  ${condStr}`,
      condition: condStr,
      children: [current],
    };
  }

  // 4. Projeção (π) – raiz
  const attrStr = columnsToString(ast.columns);
  const projNode: RelAlgNode = {
    id: nextId("P"),
    kind: "projection",
    label: `π  ${attrStr}`,
    attributes: ast.columns
      .filter((c) => c.type === "column")
      .map((c) =>
        c.type === "column" ? (c.table ? `${c.table}.${c.column}` : c.column) : "*"
      ),
    children: [current],
  };

  return projNode;
}

// ---- Gera a expressão textual de álgebra relacional ----
export function treeToExpression(node: RelAlgNode): string {
  if (node.kind === "relation") return node.label;

  const childExprs = node.children.map(treeToExpression);

  switch (node.kind) {
    case "projection":
      return `π_{${node.attributes?.join(", ") ?? "*"}} (${childExprs[0]})`;
    case "selection":
      return `σ_{${node.condition}} (${childExprs[0]})`;
    case "join":
      return `(${childExprs[0]} ⋈_{${node.condition}} ${childExprs[1]})`;
    default:
      return childExprs.join(" ");
  }
}
