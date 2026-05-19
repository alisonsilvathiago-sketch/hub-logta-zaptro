import { buildGlobalOperationalAlerts, getGlobalMonitoringSummary } from './logtaGlobalIntelligence';
import type { MotoristaRow, TransactionRow, VehicleRow } from '../contexts/OperationalDataContext';
import type { ShipmentNormalized } from '../modules/fretes/types';
import type { RouteDeliveryNormalized } from '../modules/roteirizacao/types';

export type LogtaIaSnapshot = {
  pathname: string;
  companyName: string;
  shipments: ShipmentNormalized[];
  deliveries: RouteDeliveryNormalized[];
  motoristas: MotoristaRow[];
  vehicles: VehicleRow[];
  transactions: TransactionRow[];
};

const MODULE_LABELS: Record<string, string> = {
  '/': 'Início',
  '/dashboard': 'Dashboard',
  '/fretes': 'Fretes',
  '/roteirizacao': 'Roteirização',
  '/financeiro': 'Financeiro',
  '/documentos': 'Documentos Fiscais',
  '/frota': 'Frota',
  '/rh': 'RH',
  '/crm': 'CRM',
  '/agenda': 'Agenda',
  '/mapa-ao-vivo': 'Mapa ao Vivo',
};

function moduleFromPath(pathname: string) {
  const key = Object.keys(MODULE_LABELS)
    .filter((p) => p !== '/' && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return key ? MODULE_LABELS[key] : 'Logta';
}

function formatBrl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function buildLogtaIaSnapshot(input: LogtaIaSnapshot) {
  const { shipments, motoristas, vehicles, transactions } = input;
  const emRota = shipments.filter((s) => s.status === 'in_transit').length;
  const atrasados = shipments.filter((s) => s.status === 'delayed').length;
  const entregues = shipments.filter((s) => s.status === 'delivered').length;
  const receita = transactions
    .filter((t) => t.type === 'income' || t.type === 'receita')
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const despesas = transactions
    .filter((t) => t.type === 'expense' || t.type === 'despesa')
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const alerts = buildGlobalOperationalAlerts({
    shipments: input.shipments,
    deliveries: input.deliveries,
    motoristas: input.motoristas,
    vehicles: input.vehicles,
    transactions: input.transactions,
  });
  const monitoring = getGlobalMonitoringSummary(alerts);
  return {
    module: moduleFromPath(input.pathname),
    emRota,
    atrasados,
    entregues,
    totalFretes: shipments.length,
    motoristas: motoristas.length,
    veiculos: vehicles.length,
    receita,
    despesas,
    margem: receita - despesas,
    alerts: alerts.slice(0, 6),
    monitoring,
  };
}

export function generateLogtaIaResponse(question: string, input: LogtaIaSnapshot): string {
  const q = question.toLowerCase().trim();
  const snap = buildLogtaIaSnapshot(input);
  const lines: string[] = [];

  if (/ol[aá]|oi|bom dia|boa tarde|boa noite/.test(q)) {
    lines.push(`Olá! Sou a **IA Operacional Logta** — acompanho ${input.companyName} em tempo real.`);
    lines.push(`Você está em **${snap.module}**. Posso explicar fretes, frota, financeiro, fiscal e RH.`);
    return lines.join('\n\n');
  }

  if (/atras|pendente|cr[ií]tic/.test(q)) {
    if (snap.atrasados > 0) {
      const late = input.shipments.filter((s) => s.status === 'delayed').slice(0, 3);
      lines.push(`⚠️ **${snap.atrasados} frete(s) com atraso** detectado(s):`);
      late.forEach((s) => {
        lines.push(`• ${s.numero_frete || s.id} — ${s.cliente_nome}: ${s.origin} → ${s.destination}`);
      });
      lines.push(`Recomendo abrir **Fretes** ou **Roteirização** para reordenar a operação.`);
    } else {
      lines.push('Nenhum atraso crítico no momento. Operação dentro do SLA esperado.');
    }
    return lines.join('\n\n');
  }

  if (/financeiro|receita|despesa|fluxo|pagamento|boleto|pix/.test(q)) {
    lines.push('**Panorama financeiro (dados operacionais):**');
    lines.push(`• Receitas: ${formatBrl(snap.receita)}`);
    lines.push(`• Despesas: ${formatBrl(snap.despesas)}`);
    lines.push(`• Margem estimada: ${formatBrl(snap.margem)}`);
    if (snap.margem < 0) {
      lines.push('\n⚠️ Margem negativa — revise combustível, manutenção e fretes com custo acima da média.');
    }
    return lines.join('\n\n');
  }

  if (/frota|ve[ií]culo|placa|ipva|manuten|pneu|combust/.test(q)) {
    const emManut = input.vehicles.filter((v) => v.status === 'manutencao' || v.status === 'maintenance').length;
    const emRotaV = input.vehicles.filter((v) => v.status === 'em_rota' || v.status === 'in_transit').length;
    lines.push(`**Frota:** ${snap.veiculos} veículos cadastrados.`);
    lines.push(`• ${emRotaV} em rota · ${emManut} em manutenção`);
    const plates = input.vehicles.slice(0, 4).map((v) => v.plate).filter(Boolean);
    if (plates.length) lines.push(`Unidades: ${plates.join(', ')}`);
    lines.push('\nAlertas de IPVA, documentação e consumo estão na **Central de Frota**.');
    return lines.join('\n\n');
  }

  if (/fiscal|ct-?e|mdf|sefaz|documento/.test(q)) {
    lines.push('**Fiscal & documentos:**');
    lines.push('• CT-e e MDF-e vinculados aos fretes ativos');
    lines.push('• Monitoramento SEFAZ com fila de rejeições');
    lines.push('• Certificado digital e manifestos em aberto geram alertas automáticos');
    lines.push('\nAcesse **Documentos Fiscais** para emitir ou corrigir pendências.');
    return lines.join('\n\n');
  }

  if (/rh|ponto|colaborador|f[eé]rias|jornada/.test(q)) {
    lines.push('**RH & jornada:**');
    lines.push(`• ${snap.motoristas} motoristas · equipe administrativa no painel RH`);
    lines.push('• Batidas de ponto em tempo real em **Jornada & Ponto**');
    lines.push('• Férias, faltas e documentos por colaborador');
    return lines.join('\n\n');
  }

  if (/crm|cliente|lead|proposta|contrato/.test(q)) {
    lines.push('**CRM & comercial:**');
    lines.push('• Pipeline com leads, propostas e clientes ativos');
    lines.push('• Alfa Logistics, Prime Cargo, TransBrasil e outros com histórico de fretes');
    lines.push('• Follow-ups e reuniões aparecem na **Agenda** integrada.');
    return lines.join('\n\n');
  }

  if (/resumo|panorama|acontecendo|hoje|agora|situa/.test(q)) {
    lines.push(`**Resumo operacional — ${input.companyName}**`);
    lines.push(`• Módulo atual: **${snap.module}**`);
    lines.push(`• ${snap.totalFretes} fretes · ${snap.emRota} em rota · ${snap.atrasados} atrasado(s) · ${snap.entregues} entregue(s) hoje`);
    lines.push(`• ${snap.motoristas} motoristas · ${snap.veiculos} veículos`);
    const nivelLabel =
      snap.monitoring.nivel === 'critico'
        ? 'Crítico'
        : snap.monitoring.nivel === 'atencao'
          ? 'Atenção'
          : 'Normal';
    lines.push(`• Status IA: **${nivelLabel}** (${snap.monitoring.critical} crítico(s))`);
    if (snap.alerts.length) {
      lines.push('\n**Alertas prioritários:**');
      snap.alerts.slice(0, 4).forEach((a) => {
        lines.push(`• ${a.title} — ${a.message}`);
      });
    }
    return lines.join('\n\n');
  }

  if (/alerta|notifica/.test(q)) {
    if (!snap.alerts.length) {
      return 'Sem alertas críticos ativos. Operação estável no momento.';
    }
    lines.push('**Alertas em tempo real:**');
    snap.alerts.forEach((a) => {
      lines.push(`• [${a.priority.toUpperCase()}] ${a.title}\n  ${a.message}`);
    });
    return lines.join('\n\n');
  }

  if (/rota|roteir|entrega|mapa/.test(q)) {
    lines.push(`**Logística:** ${input.deliveries.length} entregas mapeadas.`);
    lines.push(`${snap.emRota} rotas ativas · use **Roteirização** para otimizar sequência e custo.`);
    return lines.join('\n\n');
  }

  lines.push(`Entendi sua pergunta sobre "${question}".`);
  lines.push(`No momento: **${snap.totalFretes} fretes**, **${snap.emRota} em rota**, margem **${formatBrl(snap.margem)}**.`);
  lines.push(`Contexto: você está em **${snap.module}**.`);
  lines.push('\nPergunte, por exemplo: "O que está atrasado?", "Resumo financeiro" ou "Alertas críticos".');
  return lines.join('\n\n');
}

export const LOGTA_IA_IDEAS = [
  'O que está acontecendo na operação agora?',
  'Quais fretes estão atrasados?',
  'Resumo financeiro de hoje',
  'Alertas críticos da plataforma',
  'Situação da frota e veículos',
  'Pendências fiscais e SEFAZ',
];
