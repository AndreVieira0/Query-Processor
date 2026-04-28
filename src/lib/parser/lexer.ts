// ============================================================
// LEXER – Tokenizador SQL (HU1)
// ============================================================

export type TokenType =
  | "KEYWORD"
  | "IDENTIFIER"
  | "OPERATOR"
  | "LITERAL_STRING"
  | "LITERAL_NUMBER"
  | "COMMA"
  | "DOT"
  | "LPAREN"
  | "RPAREN"
  | "ASTERISK"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "ON",
  "AND",
  "INNER",
  "LEFT",
  "RIGHT",
  "OUTER",
  "AS",
]);

const OPERATORS = new Set(["=", ">", "<", ">=", "<=", "<>"]);

export function tokenize(input: string): Token[] {
  // Normaliza: colapsa múltiplos espaços em branco
  const src = input.replace(/\s+/g, " ").trim();
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    // Pula espaços
    if (src[i] === " ") { i++; continue; }

    // String literal
    if (src[i] === "'" || src[i] === '"') {
      const quote = src[i];
      let j = i + 1;
      while (j < src.length && src[j] !== quote) j++;
      tokens.push({ type: "LITERAL_STRING", value: src.slice(i + 1, j), pos: i });
      i = j + 1;
      continue;
    }

    // Número
    if (/\d/.test(src[i])) {
      let j = i;
      while (j < src.length && /[\d.]/.test(src[j])) j++;
      tokens.push({ type: "LITERAL_NUMBER", value: src.slice(i, j), pos: i });
      i = j;
      continue;
    }

    // Operadores de dois caracteres: >=, <=, <>
    if (i + 1 < src.length) {
      const two = src.slice(i, i + 2);
      if (OPERATORS.has(two)) {
        tokens.push({ type: "OPERATOR", value: two, pos: i });
        i += 2;
        continue;
      }
    }

    // Operador de um caractere
    if (OPERATORS.has(src[i])) {
      tokens.push({ type: "OPERATOR", value: src[i], pos: i });
      i++;
      continue;
    }

    // Símbolos especiais
    if (src[i] === ",") { tokens.push({ type: "COMMA", value: ",", pos: i }); i++; continue; }
    if (src[i] === ".") { tokens.push({ type: "DOT", value: ".", pos: i }); i++; continue; }
    if (src[i] === "(") { tokens.push({ type: "LPAREN", value: "(", pos: i }); i++; continue; }
    if (src[i] === ")") { tokens.push({ type: "RPAREN", value: ")", pos: i }); i++; continue; }
    if (src[i] === "*") { tokens.push({ type: "ASTERISK", value: "*", pos: i }); i++; continue; }

    // Identificador ou keyword
    if (/[a-zA-Z_]/.test(src[i])) {
      let j = i;
      while (j < src.length && /[\w]/.test(src[j])) j++;
      const word = src.slice(i, j);
      const upper = word.toUpperCase();
      tokens.push({
        type: KEYWORDS.has(upper) ? "KEYWORD" : "IDENTIFIER",
        value: word,
        pos: i,
      });
      i = j;
      continue;
    }

    // Caractere desconhecido — pula
    i++;
  }

  tokens.push({ type: "EOF", value: "", pos: src.length });
  return tokens;
}
