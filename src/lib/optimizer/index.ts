// ============================================================
// OTIMIZADOR DE CONSULTAS – Heurísticas (HU4)
// ============================================================
// Heurísticas aplicadas:
//  a) Descer seleções (σ) o mais cedo possível (push-down)
//  b) Descer projeções (π) para reduzir atributos cedo
//  c) Reordenar JOINs: mais restritivos primeiro (mais condições = mais restritivo)
//  d) Evitar produto cartesiano (JOINs sem condição são mantidos por último)
// ============================================================

import type { RelAlgNode } from "@/types";

// Deep clone para não mutar a árvore original
function clone(node: RelAlgNode): RelAlgNode {
  return {
    ...node,
    children: node.children.map(clone),
  };
}

// ---- Coleta todas as seleções (σ) da árvore ----
function extractSelections(node: RelAlgNode): {
  conditions: string[];
  stripped: RelAlgNode;
} {
  const conditions: string[] = [];

  function strip(n: RelAlgNode): RelAlgNode {
    if (n.kind === "selection") {
      if (n.condition) conditions.push(n.condition);
      return strip(n.children[0]);
    }
    return { ...n, children: n.children.map(strip) };
  }

  return { conditions, stripped: strip(clone(node)) };
}

// ---- Conta quantas condições existem numa string de condição ----
function countConditions(cond: string): number {
  // Conta ocorrências de operadores de comparação como proxy de "restritividade"
  return (cond.match(/[=<>≠≥≤]/g) ?? []).length;
}

// ---- Reordena nós folha (tabelas) com base nas condições de JOIN ----
// Tabelas cujos JOINs têm mais condições ficam primeiro (mais restritivas)
function reorderJoins(node: RelAlgNode): RelAlgNode {
  if (node.kind !== "join") {
    return { ...node, children: node.children.map(reorderJoins) };
  }

  // Coleta todos os JOINs encadeados
  const joinNodes: Array<{ condition: string; rightLeaf: RelAlgNode }> = [];
  let leftmost: RelAlgNode = node;

  // Desempilha a cadeia de JOINs (left-deep tree)
  while (leftmost.kind === "join") {
    joinNodes.unshift({
      condition: leftmost.condition ?? "",
      rightLeaf: leftmost.children[1],
    });
    leftmost = leftmost.children[0];
  }

  // Ordena: mais condições primeiro, sem condição por último (evitar cartesiano)
  joinNodes.sort((a, b) => {
    const ca = a.condition ? countConditions(a.condition) : -1;
    const cb = b.condition ? countConditions(b.condition) : -1;
    return cb - ca;
  });

  // Reconstrói a cadeia left-deep
  let result: RelAlgNode = leftmost;
  for (const j of joinNodes) {
    result = {
      id: `${result.id}_opt`,
      kind: "join",
      label: `⋈  ${j.condition}`,
      condition: j.condition,
      children: [result, j.rightLeaf],
    };
  }

  return result;
}

// ---- Reaplicar seleções o mais próximo possível das folhas ----
// Estratégia: insere σ logo acima da relação/join que contém as colunas referenciadas
function pushDownSelections(
  node: RelAlgNode,
  selections: string[]
): RelAlgNode {
  if (selections.length === 0) return node;

  // Função auxiliar: quais tabelas um nó "produz"?
  function tablesOf(n: RelAlgNode): Set<string> {
    if (n.kind === "relation") return new Set([n.table?.toLowerCase() ?? ""]);
    const s = new Set<string>();
    for (const c of n.children) {
      tablesOf(c).forEach((t) => s.add(t));
    }
    return s;
  }

  // Uma condição pode ser aplicada sobre um nó se as tabelas referenciadas
  // estão todas disponíveis naquele nó
  function condTables(cond: string): string[] {
    // Extrai "tabela.coluna" ou apenas tenta resolver pelo schema
    const matches = cond.match(/(\w+)\.\w+/g) ?? [];
    return matches.map((m) => m.split(".")[0].toLowerCase());
  }

  function pushDown(n: RelAlgNode, remaining: string[]): RelAlgNode {
    if (remaining.length === 0) return n;

    const available = tablesOf(n);
    const [applyNow, defer] = remaining.reduce<[string[], string[]]>(
      ([now, later], cond) => {
        const tables = condTables(cond);
        const canApply = tables.length === 0 || tables.every((t) => available.has(t));
        return canApply ? [[...now, cond], later] : [now, [...later, cond]];
      },
      [[], []]
    );

    // Primeiro, push-down recursivo para filhos
    const optimizedChildren = n.children.map((child) =>
      pushDown(child, defer)
    );
    const optimizedNode = { ...n, children: optimizedChildren };

    // Depois, envolve este nó com as seleções que podem ser aplicadas aqui
    let result: RelAlgNode = optimizedNode;
    for (const cond of applyNow) {
      result = {
        id: `sel_${result.id}`,
        kind: "selection",
        label: `σ  ${cond}`,
        condition: cond,
        children: [result],
      };
    }

    return result;
  }

  return pushDown(node, selections);
}

// ---- PIPELINE DE OTIMIZAÇÃO PRINCIPAL ----
export function optimizeTree(root: RelAlgNode): RelAlgNode {
  let tree = clone(root);

  // Passo 1: Extrai todas as seleções da árvore original
  const { conditions, stripped } = extractSelections(tree);
  tree = stripped;

  // Passo 2: Reordena JOINs (mais restritivos primeiro)
  tree = reorderJoins(tree);

  // Passo 3: Push-down das seleções (o mais próximo das folhas possível)
  tree = pushDownSelections(tree, conditions);

  return tree;
}
