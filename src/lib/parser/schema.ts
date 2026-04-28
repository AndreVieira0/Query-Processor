import type { SchemaMap } from "@/types";

/**
 * Schema de referência para validação semântica (HU1).
 * Chaves normalizadas para lowercase para comparação case-insensitive.
 */
export const DB_SCHEMA: SchemaMap = {
  categoria: {
    name: "Categoria",
    columns: ["idcategoria", "descricao"],
  },
  produto: {
    name: "Produto",
    columns: [
      "idproduto",
      "nome",
      "descricao",
      "preco",
      "quantestoque",
      "categoria_idcategoria",
    ],
  },
  tipocliente: {
    name: "TipoCliente",
    columns: ["idtipocliente", "descricao"],
  },
  cliente: {
    name: "Cliente",
    columns: [
      "idcliente",
      "nome",
      "email",
      "nascimento",
      "senha",
      "tipocliente_idtipocliente",
      "dataregistro",
    ],
  },
  tipoendereco: {
    name: "TipoEndereco",
    columns: ["idtipoendereco", "descricao"],
  },
  endereco: {
    name: "Endereco",
    columns: [
      "idendereco",
      "enderecopadrao",
      "logradouro",
      "numero",
      "complemento",
      "bairro",
      "cidade",
      "uf",
      "cep",
      "tipoendereco_idtipoendereco",
      "cliente_idcliente",
    ],
  },
  telefone: {
    name: "Telefone",
    columns: ["numero", "cliente_idcliente"],
  },
  status: {
    name: "Status",
    columns: ["idstatus", "descricao"],
  },
  pedido: {
    name: "Pedido",
    columns: [
      "idpedido",
      "status_idstatus",
      "datapedido",
      "valortotalpedido",
      "cliente_idcliente",
    ],
  },
  pedido_has_produto: {
    name: "Pedido_has_Produto",
    columns: [
      "idpedidoproduto",
      "pedido_idpedido",
      "produto_idproduto",
      "quantidade",
      "precounitario",
    ],
  },
};

/** Retorna o nome canônico da tabela (preservando case original) */
export function getCanonicalTableName(name: string): string | null {
  const key = name.toLowerCase();
  return DB_SCHEMA[key]?.name ?? null;
}

/** Verifica se uma coluna existe em uma tabela */
export function columnExistsInTable(table: string, column: string): boolean {
  const schema = DB_SCHEMA[table.toLowerCase()];
  if (!schema) return false;
  return schema.columns.includes(column.toLowerCase());
}

/** Verifica se uma coluna existe em QUALQUER tabela do schema */
export function columnExistsAnywhere(column: string): string | null {
  const col = column.toLowerCase();
  for (const [key, schema] of Object.entries(DB_SCHEMA)) {
    if (schema.columns.includes(col)) return schema.name;
  }
  return null;
}
