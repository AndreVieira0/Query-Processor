# Processador de Consultas SQL

**Disciplina:** Banco de Dados  
**Autores:** Membro 1, Membro 2, Membro 3

## Visão Geral

Aplicação web que processa consultas SQL e exibe:
- Validação sintática e semântica (HU1)
- Conversão para Álgebra Relacional com notação σ, π, ⋈ (HU2)
- Grafo de Operadores interativo via React Flow (HU3)
- Grafo Otimizado com heurísticas de push-down (HU4)
- Plano de Execução passo a passo (HU5)

## Setup

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
# Abrir http://localhost:3000

# Build de produção
npm run build && npm start

# Verificação de tipos
npm run type-check

# Smoke tests
npx tsx src/tests/smoke.ts
```

## Arquitetura

```
src/
├── types/index.ts              # Tipos centrais (AST, RelAlgNode, etc.)
├── lib/
│   ├── parser/
│   │   ├── lexer.ts            # Tokenizador SQL
│   │   ├── schema.ts           # Metadados/schema do BD (HU1)
│   │   └── index.ts            # Parser SQL → AST + validação semântica
│   ├── algebra/index.ts        # AST → RelAlgNode + expressão textual (HU2)
│   ├── graph/index.ts          # RelAlgNode → React Flow nodes/edges (HU3)
│   ├── optimizer/index.ts      # Heurísticas de otimização (HU4)
│   ├── executor/index.ts       # Gerador de plano de execução (HU5)
│   └── index.ts                # Orquestrador principal
├── components/
│   ├── graph/
│   │   ├── GraphPanel.tsx      # Painel React Flow
│   │   └── OperatorNode.tsx    # Nó customizado do grafo
│   └── ui/panels.tsx           # Componentes de UI
└── app/
    ├── layout.tsx
    └── page.tsx                # Página principal
```

## Schema de Referência (HU1)

| Tabela | Colunas principais |
|--------|--------------------|
| Categoria | idCategoria, Descricao |
| Produto | idProduto, Nome, Descricao, Preco, QuantEstoque, Categoria_idCategoria |
| TipoCliente | idTipoCliente, Descricao |
| Cliente | idCliente, Nome, Email, Nascimento, Senha, TipoCliente_idTipoCliente, DataRegistro |
| TipoEndereco | idTipoEndereco, Descricao |
| Endereco | idEndereco, EnderecoPadrao, Logradouro, Numero, Complemento, Bairro, Cidade, UF, CEP, TipoEndereco_idTipoEndereco, Cliente_idCliente |
| Telefone | Numero, Cliente_idCliente |
| Status | idStatus, Descricao |
| Pedido | idPedido, Status_idStatus, DataPedido, ValorTotalPedido, Cliente_idCliente |
| Pedido_has_Produto | idPedidoProduto, Pedido_idPedido, Produto_idProduto, Quantidade, PrecoUnitario |

## Heurísticas de Otimização (HU4)

1. **Push-down de seleções (σ):** filtros são movidos para o mais próximo possível das folhas (tabelas base), reduzindo o número de tuplas antes das junções.
2. **Push-down de projeções (π):** aplicadas o mais cedo possível para reduzir atributos.
3. **Reordenação de JOINs:** JOINs com mais condições (mais restritivos) são executados primeiro.
4. **Evitar produto cartesiano:** JOINs sem condição ficam por último.

## Tecnologias

- **Next.js 14** + **TypeScript** (frontend + lógica)
- **React Flow (@xyflow/react)** – visualização interativa dos grafos
- **Dagre** – layout automático dos grafos (top-down)
- **JetBrains Mono** + **Syne** – tipografia
