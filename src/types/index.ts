// ============================================================
// TIPOS CENTRAIS DO PROCESSADOR DE CONSULTAS
// ============================================================

// ------- SCHEMA / METADADOS -------
export interface TableSchema {
  name: string;
  columns: string[];
}

export type SchemaMap = Record<string, TableSchema>;

// ------- AST (Árvore Sintática Abstrata) -------
export type SelectColumn =
  | { type: "wildcard" }
  | { type: "column"; table?: string; column: string };

export interface JoinClause {
  type: "JOIN";
  table: string;
  alias?: string;
  on: ConditionNode;
}

export type Operator = "=" | ">" | "<" | ">=" | "<=" | "<>";

export interface ComparisonNode {
  type: "comparison";
  left: ColumnRef | LiteralNode;
  operator: Operator;
  right: ColumnRef | LiteralNode;
}

export interface AndNode {
  type: "and";
  left: ConditionNode;
  right: ConditionNode;
}

export interface ColumnRef {
  type: "column_ref";
  table?: string;
  column: string;
}

export interface LiteralNode {
  type: "literal";
  value: string | number;
}

export type ConditionNode = ComparisonNode | AndNode;

export interface SelectAST {
  type: "SELECT";
  columns: SelectColumn[];
  from: { table: string; alias?: string };
  joins: JoinClause[];
  where?: ConditionNode;
}

// ------- RESULTADO DE PARSING -------
export interface ParseResult {
  success: boolean;
  ast?: SelectAST;
  errors: string[];
}

// ------- ÁLGEBRA RELACIONAL -------
export interface RelAlgNode {
  id: string;
  kind:
    | "projection"   // π
    | "selection"    // σ
    | "join"         // ⋈
    | "relation";    // Tabela base
  label: string;     // Expressão legível
  children: RelAlgNode[];
  // Metadados extras
  table?: string;
  condition?: string;
  attributes?: string[];
}

// ------- PLANO DE EXECUÇÃO -------
export interface ExecutionStep {
  order: number;
  operation: string;
  description: string;
  cost?: string; // estimativa qualitativa
}

// ------- RESULTADO FINAL PROCESSADO -------
export interface ProcessResult {
  parseResult: ParseResult;
  relationalAlgebra: string;       // Expressão em texto
  relAlgTree: RelAlgNode | null;   // Árvore não-otimizada
  optimizedTree: RelAlgNode | null;// Árvore após heurísticas
  executionPlan: ExecutionStep[];
}
