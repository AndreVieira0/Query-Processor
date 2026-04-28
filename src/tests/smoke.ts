// ============================================================
// SMOKE TESTS – Valida parser, álgebra e otimizador
// Execute: npx ts-node src/tests/smoke.ts
// ============================================================

import { processQuery } from "../lib";

const TESTS = [
  {
    name: "✅ SELECT simples com WHERE",
    sql: "SELECT Cliente.Nome, Cliente.Email FROM Cliente WHERE Cliente.idCliente = 1",
  },
  {
    name: "✅ JOIN entre Pedido e Cliente",
    sql: `SELECT Cliente.Nome, Pedido.DataPedido
FROM Cliente
JOIN Pedido ON Pedido.Cliente_idCliente = Cliente.idCliente
WHERE Pedido.ValorTotalPedido > 100`,
  },
  {
    name: "✅ Múltiplos JOINs (3 tabelas)",
    sql: `SELECT Cliente.Nome, Produto.Nome, Pedido_has_Produto.Quantidade
FROM Cliente
JOIN Pedido ON Pedido.Cliente_idCliente = Cliente.idCliente
JOIN Pedido_has_Produto ON Pedido_has_Produto.Pedido_idPedido = Pedido.idPedido
JOIN Produto ON Pedido_has_Produto.Produto_idProduto = Produto.idProduto`,
  },
  {
    name: "✅ Case-insensitive",
    sql: "select produto.nome, produto.preco from produto where produto.preco >= 50",
  },
  {
    name: "❌ Tabela inexistente",
    sql: "SELECT id FROM Venda WHERE id = 1",
  },
  {
    name: "❌ Coluna inexistente",
    sql: "SELECT Cliente.Cpf FROM Cliente WHERE Cliente.idCliente = 1",
  },
  {
    name: "❌ Sintaxe inválida (sem FROM)",
    sql: "SELECT Nome WHERE id = 1",
  },
];

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║     PROCESSADOR DE CONSULTAS – Smoke Tests          ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

for (const test of TESTS) {
  console.log(`\n── ${test.name}`);
  console.log(`   SQL: ${test.sql.replace(/\n/g, " ").slice(0, 80)}...`);

  const result = processQuery(test.sql);

  if (!result.parseResult.success) {
    console.log(`   ✖ Erros: ${result.parseResult.errors.join(" | ")}`);
  } else {
    console.log(`   ✓ Parse OK`);
    console.log(`   ∑ Álgebra: ${result.relationalAlgebra.slice(0, 100)}...`);
    console.log(`   ⚡ Plano: ${result.executionPlan.length} passos`);
    result.executionPlan.forEach((s) =>
      console.log(`      ${s.order}. ${s.operation}: ${s.description}`)
    );
  }
}

console.log("\n──────────────────────────────────────────────────────\n");
