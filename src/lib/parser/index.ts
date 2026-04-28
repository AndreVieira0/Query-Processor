// ============================================================
// PARSER SQL → AST (HU1)
// Suporta: SELECT, FROM, WHERE, JOIN, ON
// Operadores: =, >, <, <=, >=, <>, AND, ()
// ============================================================

import { tokenize, type Token, type TokenType } from "./lexer";
import type {
  SelectAST,
  SelectColumn,
  JoinClause,
  ConditionNode,
  ComparisonNode,
  AndNode,
  ColumnRef,
  LiteralNode,
  Operator,
  ParseResult,
} from "@/types";

class ParseError extends Error {
  constructor(msg: string) { super(msg); }
}

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token { return this.tokens[this.pos]; }
  private advance(): Token { return this.tokens[this.pos++]; }

  private expect(type: TokenType, value?: string): Token {
    const tok = this.peek();
    if (tok.type !== type) {
      throw new ParseError(
        `Esperado token do tipo '${type}'${value ? ` com valor '${value}'` : ""}, mas encontrado '${tok.value}' (${tok.type}) na posição ${tok.pos}`
      );
    }
    if (value && tok.value.toUpperCase() !== value.toUpperCase()) {
      throw new ParseError(
        `Esperado '${value}', mas encontrado '${tok.value}' na posição ${tok.pos}`
      );
    }
    return this.advance();
  }

  private isKeyword(value: string): boolean {
    const tok = this.peek();
    return tok.type === "KEYWORD" && tok.value.toUpperCase() === value.toUpperCase();
  }

  private isOperator(): boolean {
    return this.peek().type === "OPERATOR";
  }

  // ---- Parsing de colunas do SELECT ----
  private parseSelectColumns(): SelectColumn[] {
    const cols: SelectColumn[] = [];

    // SELECT *
    if (this.peek().type === "ASTERISK") {
      this.advance();
      return [{ type: "wildcard" }];
    }

    cols.push(this.parseOneSelectColumn());
    while (this.peek().type === "COMMA") {
      this.advance();
      cols.push(this.parseOneSelectColumn());
    }
    return cols;
  }

  private parseOneSelectColumn(): SelectColumn {
    const first = this.expect("IDENTIFIER");

    if (this.peek().type === "DOT") {
      this.advance();
      const col = this.expect("IDENTIFIER");
      return { type: "column", table: first.value, column: col.value };
    }

    return { type: "column", column: first.value };
  }

  // ---- FROM table [AS alias] ----
  private parseFrom(): { table: string; alias?: string } {
    this.expect("KEYWORD", "FROM");
    const table = this.expect("IDENTIFIER");
    let alias: string | undefined;
    if (this.isKeyword("AS")) {
      this.advance();
      alias = this.expect("IDENTIFIER").value;
    } else if (
      this.peek().type === "IDENTIFIER" &&
      !this.isKeyword("WHERE") &&
      !this.isKeyword("JOIN") &&
      !this.isKeyword("INNER") &&
      !this.isKeyword("LEFT") &&
      !this.isKeyword("RIGHT")
    ) {
      alias = this.advance().value;
    }
    return { table: table.value, alias };
  }

  // ---- JOIN table [AS alias] ON condition ----
  private parseJoins(): JoinClause[] {
    const joins: JoinClause[] = [];

    while (
      this.isKeyword("JOIN") ||
      this.isKeyword("INNER") ||
      this.isKeyword("LEFT") ||
      this.isKeyword("RIGHT")
    ) {
      // Consome modificadores INNER/LEFT/RIGHT opcionais
      if (this.isKeyword("INNER") || this.isKeyword("LEFT") || this.isKeyword("RIGHT")) {
        this.advance();
        if (this.isKeyword("OUTER")) this.advance();
      }
      this.expect("KEYWORD", "JOIN");
      const table = this.expect("IDENTIFIER");
      let alias: string | undefined;
      if (this.isKeyword("AS")) {
        this.advance();
        alias = this.expect("IDENTIFIER").value;
      } else if (this.peek().type === "IDENTIFIER") {
        alias = this.advance().value;
      }
      this.expect("KEYWORD", "ON");
      const condition = this.parseCondition();
      joins.push({ type: "JOIN", table: table.value, alias, on: condition });
    }

    return joins;
  }

  // ---- WHERE condition ----
  private parseWhere(): ConditionNode | undefined {
    if (!this.isKeyword("WHERE")) return undefined;
    this.advance();
    return this.parseCondition();
  }

  // ---- Condition = comparison (AND comparison)* ----
  private parseCondition(): ConditionNode {
    let left = this.parsePrimary();

    while (this.isKeyword("AND")) {
      this.advance();
      const right = this.parsePrimary();
      const andNode: AndNode = { type: "and", left, right };
      left = andNode;
    }

    return left;
  }

  private parsePrimary(): ConditionNode {
    if (this.peek().type === "LPAREN") {
      this.advance();
      const cond = this.parseCondition();
      this.expect("RPAREN");
      return cond;
    }
    return this.parseComparison();
  }

  private parseComparison(): ComparisonNode {
    const left = this.parseOperand();
    if (!this.isOperator()) {
      throw new ParseError(
        `Operador de comparação esperado após '${this.tokens[this.pos - 1].value}', mas encontrado '${this.peek().value}'`
      );
    }
    const op = this.advance().value as Operator;
    const right = this.parseOperand();
    return { type: "comparison", left, operator: op, right };
  }

  private parseOperand(): ColumnRef | LiteralNode {
    const tok = this.peek();

    if (tok.type === "LITERAL_STRING") {
      this.advance();
      return { type: "literal", value: tok.value };
    }

    if (tok.type === "LITERAL_NUMBER") {
      this.advance();
      return { type: "literal", value: parseFloat(tok.value) };
    }

    if (tok.type === "IDENTIFIER") {
      const first = this.advance();
      if (this.peek().type === "DOT") {
        this.advance();
        const col = this.expect("IDENTIFIER");
        return { type: "column_ref", table: first.value, column: col.value };
      }
      return { type: "column_ref", column: first.value };
    }

    throw new ParseError(
      `Operando inválido: '${tok.value}' (${tok.type}) na posição ${tok.pos}`
    );
  }

  // ---- Entry point ----
  parse(): SelectAST {
    this.expect("KEYWORD", "SELECT");
    const columns = this.parseSelectColumns();
    const from = this.parseFrom();
    const joins = this.parseJoins();
    const where = this.parseWhere();

    if (this.peek().type !== "EOF") {
      throw new ParseError(
        `Token inesperado após a consulta: '${this.peek().value}'`
      );
    }

    return { type: "SELECT", columns, from, joins, where };
  }
}

// ============================================================
// VALIDADOR SEMÂNTICO (HU1 – schema check)
// ============================================================
import { DB_SCHEMA, columnExistsInTable } from "./schema";

function validateAST(ast: SelectAST): string[] {
  const errors: string[] = [];

  // Mapa: alias/nome → nome canônico de tabela
  const tableAliasMap: Record<string, string> = {};

  // Registra tabela principal
  const fromKey = ast.from.table.toLowerCase();
  if (!DB_SCHEMA[fromKey]) {
    errors.push(`Tabela não encontrada no schema: '${ast.from.table}'`);
  } else {
    const alias = (ast.from.alias ?? ast.from.table).toLowerCase();
    tableAliasMap[alias] = fromKey;
    tableAliasMap[fromKey] = fromKey;
  }

  // Registra tabelas de JOIN
  for (const join of ast.joins) {
    const joinKey = join.table.toLowerCase();
    if (!DB_SCHEMA[joinKey]) {
      errors.push(`Tabela de JOIN não encontrada: '${join.table}'`);
    } else {
      const alias = (join.alias ?? join.table).toLowerCase();
      tableAliasMap[alias] = joinKey;
      tableAliasMap[joinKey] = joinKey;
    }
  }

  // Helper: valida referência de coluna
  function validateColumnRef(table: string | undefined, column: string, context: string) {
    if (table) {
      const tableKey = tableAliasMap[table.toLowerCase()];
      if (!tableKey) {
        errors.push(`${context}: tabela/alias '${table}' não encontrada na consulta`);
        return;
      }
      if (!columnExistsInTable(tableKey, column)) {
        errors.push(
          `${context}: coluna '${column}' não existe na tabela '${DB_SCHEMA[tableKey]?.name ?? table}'`
        );
      }
    } else {
      // Sem qualificador de tabela → busca em todas as tabelas da query
      const tables = Object.values(tableAliasMap);
      const found = tables.some((t) => columnExistsInTable(t, column));
      if (!found) {
        errors.push(
          `${context}: coluna '${column}' não encontrada em nenhuma das tabelas da consulta`
        );
      }
    }
  }

  // Valida colunas do SELECT
  for (const col of ast.columns) {
    if (col.type === "column") {
      validateColumnRef(col.table, col.column, "SELECT");
    }
  }

  // Valida condições recursivamente
  function validateCondition(node: ConditionNode, context: string) {
    if (node.type === "and") {
      validateCondition(node.left, context);
      validateCondition(node.right, context);
    } else {
      // comparison
      if (node.left.type === "column_ref") {
        validateColumnRef(node.left.table, node.left.column, context);
      }
      if (node.right.type === "column_ref") {
        validateColumnRef(node.right.table, node.right.column, context);
      }
    }
  }

  for (const join of ast.joins) {
    validateCondition(join.on, `ON do JOIN com '${join.table}'`);
  }

  if (ast.where) {
    validateCondition(ast.where, "WHERE");
  }

  return errors;
}

// ============================================================
// FUNÇÃO PRINCIPAL EXPORTADA
// ============================================================
export function parseSQL(sql: string): ParseResult {
  try {
    const tokens = tokenize(sql);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const semanticErrors = validateAST(ast);

    if (semanticErrors.length > 0) {
      return { success: false, ast, errors: semanticErrors };
    }

    return { success: true, ast, errors: [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, errors: [msg] };
  }
}
