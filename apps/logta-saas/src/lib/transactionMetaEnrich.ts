export type TransactionDetailMeta = {
  motorista_nome?: string;
  motorista_tipo?: 'motorista' | 'colaborador';
  colaborador_nome?: string;
  placa?: string;
  posto?: string;
  data_uso?: string;
  hora_uso?: string;
  litros?: number;
  km_rodado?: number;
  cliente_nome?: string;
  frete_numero?: string;
  pix_favorecido?: string;
  pix_chave?: string;
  pix_tipo?: string;
  banco?: string;
  observacao?: string;
};

const DEMO_MOTORISTAS = [
  { nome: 'Carlos Henrique', placa: 'BRA-2L22' },
  { nome: 'André Ferreira', placa: 'KJU-9011' },
  { nome: 'Ricardo Souza', placa: 'MNH-4455' },
];

export function enrichTransactionMeta(tx: Record<string, unknown>, index = 0): Record<string, unknown> {
  const cat = String(tx.categoria || tx.category || '').toLowerCase();
  const desc = String(tx.descricao || tx.description || '');
  const existing =
    typeof tx.metadata === 'object' && tx.metadata ? (tx.metadata as TransactionDetailMeta) : {};
  if (Object.keys(existing).length > 3) {
    return { ...tx, metadata: existing };
  }

  const mot = DEMO_MOTORISTAS[index % DEMO_MOTORISTAS.length];
  const baseDate = tx.data_vencimento || tx.paid_at || tx.created_at;
  const d = baseDate ? new Date(String(baseDate)) : new Date();

  const meta: TransactionDetailMeta = { ...existing };

  if (cat.includes('combustivel') || desc.toLowerCase().includes('combust')) {
    meta.motorista_nome = meta.motorista_nome || mot.nome;
    meta.motorista_tipo = meta.motorista_tipo || 'motorista';
    meta.placa = meta.placa || mot.placa;
    meta.posto = meta.posto || 'Posto Ipiranga — Marginal Tietê';
    meta.data_uso = meta.data_uso || d.toISOString();
    meta.hora_uso = meta.hora_uso || '14:32';
    meta.litros = meta.litros ?? 1420;
    meta.km_rodado = meta.km_rodado ?? 680;
    meta.pix_favorecido = meta.pix_favorecido || 'Ipiranga Combustíveis LTDA';
    meta.pix_chave = meta.pix_chave || '12.345.678/0001-88';
    meta.pix_tipo = meta.pix_tipo || 'CNPJ';
  }

  if (cat.includes('receita') || cat.includes('receb') || tx.tipo === 'receita') {
    const freteMatch = desc.match(/LF-\d+/i);
    meta.frete_numero = meta.frete_numero || freteMatch?.[0] || 'LF-240891';
    meta.cliente_nome = meta.cliente_nome || desc.split('—')[0]?.replace(/Frete/i, '').trim() || 'Cliente';
    meta.data_uso = meta.data_uso || d.toISOString();
  }

  if (cat.includes('folha') || desc.toLowerCase().includes('salário')) {
    meta.colaborador_nome = meta.colaborador_nome || 'Equipe operacional';
    meta.motorista_tipo = 'colaborador';
    meta.pix_favorecido = meta.pix_favorecido || 'Folha Logta RH';
    meta.pix_chave = meta.pix_chave || 'folha@logta.com.br';
    meta.pix_tipo = meta.pix_tipo || 'E-mail';
  }

  if (tx.tipo === 'despesa' && !meta.pix_favorecido) {
    meta.pix_favorecido = meta.pix_favorecido || desc.split('—')[0]?.trim() || 'Fornecedor';
    meta.pix_chave = meta.pix_chave || '(informar na confirmação)';
    meta.pix_tipo = meta.pix_tipo || 'PIX';
  }

  return { ...tx, metadata: meta };
}
