/** Colunas oficiais LogStoka — alinhadas ao backend Supabase / ls_reports_imports. */
export type ImportSpreadsheetColumnKey =
  | 'sku'
  | 'quantity'
  | 'marketplace'
  | 'store'
  | 'warehouse'
  | 'date'
  | 'product_name';

export type ImportSpreadsheetColumnDef = {
  key: ImportSpreadsheetColumnKey;
  header: string;
  required: boolean;
  aliases: string[];
  hint: string;
};

export const IMPORT_SPREADSHEET_COLUMNS: ImportSpreadsheetColumnDef[] = [
  {
    key: 'sku',
    header: 'sku',
    required: true,
    aliases: ['sku', 'codigo', 'código', 'codigo_produto', 'cod_produto', 'ls', 'referencia'],
    hint: 'Código SKU ou LS do produto cadastrado',
  },
  {
    key: 'quantity',
    header: 'quantidade',
    required: true,
    aliases: ['quantidade', 'qtd', 'qty', 'quant', 'unidades', 'un'],
    hint: 'Número inteiro de unidades (saída ou entrada)',
  },
  {
    key: 'marketplace',
    header: 'marketplace',
    required: true,
    aliases: ['marketplace', 'canal', 'plataforma', 'mp'],
    hint: 'mercadolivre, shopee, amazon, magalu, tiktok ou interno',
  },
  {
    key: 'store',
    header: 'loja',
    required: false,
    aliases: ['loja', 'store', 'nome_loja', 'seller', 'vendedor'],
    hint: 'Nome da loja no marketplace (opcional)',
  },
  {
    key: 'warehouse',
    header: 'cd',
    required: false,
    aliases: ['cd', 'warehouse', 'deposito', 'depósito', 'galpao', 'galpão', 'centro'],
    hint: 'CD-OSA, CD-COTIA ou nome do galpão',
  },
  {
    key: 'date',
    header: 'data',
    required: false,
    aliases: ['data', 'date', 'dia', 'data_saida', 'data_movimento'],
    hint: 'Data da movimentação (AAAA-MM-DD)',
  },
  {
    key: 'product_name',
    header: 'nome_produto',
    required: false,
    aliases: ['nome_produto', 'nome', 'produto', 'descricao', 'descrição', 'item'],
    hint: 'Descrição para conferência (opcional)',
  },
];

export const IMPORT_TEMPLATE_HEADERS = IMPORT_SPREADSHEET_COLUMNS.map((c) => c.header);

export const IMPORT_TEMPLATE_SAMPLE_ROW: string[] = [
  'BBR-CHU-A1',
  '10',
  'mercadolivre',
  'Pluma Baby',
  'CD-OSA',
  '2026-05-31',
  'Chupeta Silicone',
];

export const IMPORT_TEMPLATE_INSTRUCTIONS = [
  'Não altere os nomes das colunas na primeira linha.',
  'Preencha sku e quantidade em todas as linhas.',
  'marketplace: mercadolivre | shopee | amazon | magalu | tiktok | interno',
  'Salve como .xlsx ou .csv antes de enviar ao LogStoka.',
];
