import { zaptroDarkEmailLayout } from './zaptroDarkLayout.js';
import { masterEmailLayout, type ThemeType } from './MasterLayout.js';

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type TemplateVars = Record<string, string | number | undefined | null>;

export type TransactionalKind =
  | 'welcome'
  | 'delivery_status'
  | '2fa_code'
  | 'new_login'
  | 'password_reset'
  | 'account_activation'
  | 'payment_failed'
  | 'invoice_overdue'
  | 'subscription_cancelled'
  | 'refund_processed'
  | 'limit_reached'
  | 'low_balance'
  | 'new_lead'
  | 'new_comment'
  | 'appointment_reminder'
  | 'new_company'
  | 'system_error'
  | 'infra_alert'
  | 'backup_success'
  | 'route_completed'
  | 'cargo_delayed'
  | 'user_added'
  | 'permission_changed'
  | 'billing_due_soon'
  | 'billing_overdue_recovery'
  | 'payment_confirmed'
  | 'growth_invitation';

export function buildTransactionalEmail(
  kind: TransactionalKind,
  companyName: string,
  vars: TemplateVars,
  signatureHtml?: string,
): { subject: string; html: string; text: string } {
  const cn = companyName.trim() || 'Zaptro';
  const name = String(vars.userName ?? vars.clientName ?? 'Cliente').trim() || 'Cliente';

  switch (kind) {
      const subject = `Bem-vindo à ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>A sua conta Zaptro foi criada com sucesso. A partir de agora pode acompanhar rotas, equipa e operações num só lugar.</p>`;
      
      const theme: ThemeType = cn.toLowerCase().includes('hub') ? 'RUBI' : cn.toLowerCase().includes('logta') ? 'SAFIRA' : 'GOLD';

      return {
        subject,
        html: masterEmailLayout({
          theme,
          companyName: cn,
          headline: 'Conta ativa',
          bodyHtml: body,
          ctaLabel: typeof vars.ctaLabel === 'string' ? vars.ctaLabel : 'Abrir painel',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: `${subject}\n\nOlá ${name}. A sua conta na ${cn} foi criada.`,
      };
    }
    case 'account_confirmation': {
      const subject = `Confirme a sua conta — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Para concluir a configuração da conta, confirme o endereço de e-mail e conclua os passos de segurança no painel.</p>`;
      return {
        subject,
        html: zaptroDarkEmailLayout({
          companyName: cn,
          headline: 'Confirmação de conta',
          bodyHtml: body,
          ctaLabel: typeof vars.ctaLabel === 'string' ? vars.ctaLabel : 'Confirmar conta',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
          signatureHtml,
        }),
        text: subject,
      };
    }
    case 'password_reset_notice': {
      const subject = 'Pedido de redefinição de senha';
      const body = `<p>Olá,</p>
        <p>Recebemos um pedido para redefinir a senha associada a este e-mail no Zaptro.</p>
        <p>Se foi você, siga as instruções na mensagem anterior ou no link enviado pelo sistema de autenticação.</p>
        <p>Se não foi você, pode ignorar este e-mail com segurança.</p>`;
      return {
        subject,
        html: zaptroDarkEmailLayout({
          companyName: cn,
          headline: 'Segurança da conta',
          bodyHtml: body,
          signatureHtml,
        }),
        text: subject,
      };
    }
    case 'payment_approved':
    case 'payment_confirmed': {
      const subject = `Pagamento confirmado — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>O seu pagamento foi <strong style="color:#22c55e;">confirmado</strong> com sucesso.</p>
        <p>Sua assinatura foi renovada e o acesso total aos recursos da plataforma <strong>${cn}</strong> continua ativo.</p>
        <p>Obrigado por confiar no nosso ecossistema para impulsionar seus resultados.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'SAFIRA',
          companyName: cn,
          headline: 'Pagamento Confirmado',
          bodyHtml: body,
          ctaLabel: 'Acessar Painel',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'cargo_created': {
      const code = vars.trackingCode != null ? esc(String(vars.trackingCode)) : '—';
      const subject = `Nova carga registada — ${code}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Uma nova carga foi criada na operação <strong>${esc(cn)}</strong>.</p>
        <p><strong>Código:</strong> ${code}<br/>
        <strong>Cliente:</strong> ${vars.clientName ? esc(String(vars.clientName)) : '—'}<br/>
        <strong>Destino:</strong> ${vars.destination ? esc(String(vars.destination)) : '—'}</p>`;
      return {
        subject,
        html: zaptroDarkEmailLayout({
          companyName: cn,
          headline: 'Carga criada',
          bodyHtml: body,
          ctaLabel: typeof vars.ctaLabel === 'string' ? vars.ctaLabel : 'Acompanhar',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
          signatureHtml,
        }),
        text: subject,
      };
    }
    case 'delivery_started':
    case 'route_notification': {
      const subject =
        kind === 'delivery_started'
          ? `Entrega iniciada — ${cn}`
          : `Atualização de rota — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>${vars.message ? esc(String(vars.message)) : 'Há uma nova movimentação na sua entrega.'}</p>
        ${vars.routeLabel ? `<p><strong>Rota:</strong> ${esc(String(vars.routeLabel))}</p>` : ''}`;
      return {
        subject,
        html: zaptroDarkEmailLayout({
          companyName: cn,
          headline: kind === 'delivery_started' ? 'Saiu para entrega' : 'Estado da rota',
          bodyHtml: body,
          ctaLabel: typeof vars.ctaLabel === 'string' ? vars.ctaLabel : 'Ver detalhes',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
          signatureHtml,
        }),
        text: subject,
      };
    }
    case 'delivery_completed': {
      const subject = `Entrega concluída — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>A entrega foi marcada como <strong style="color:#D9FF00;">concluída</strong>.</p>
        ${vars.message ? `<p>${esc(String(vars.message))}</p>` : ''}`;
      return {
        subject,
        html: zaptroDarkEmailLayout({
          companyName: cn,
          headline: 'Entrega concluída',
          bodyHtml: body,
          ctaLabel: typeof vars.ctaLabel === 'string' ? vars.ctaLabel : undefined,
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
          signatureHtml,
        }),
        text: subject,
      };
    }
    case 'delivery_status': {
      const st = vars.status ? esc(String(vars.status)) : 'Atualizado';
      const subject = `Estado da entrega: ${st} — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>O estado da sua entrega foi actualizado para <strong style="color:#D9FF00;">${st}</strong>.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'SAFIRA',
          companyName: cn,
          headline: 'Estado da entrega',
          bodyHtml: body,
          ctaLabel: typeof vars.ctaLabel === 'string' ? vars.ctaLabel : 'Acompanhar envio',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case '2fa_code': {
      const subject = `Seu código de acesso — ${cn}`;
      const code = vars.code ? esc(String(vars.code)) : '000000';
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Use o código abaixo para concluir seu acesso no sistema:</p>
        <div style="font-size: 42px; font-weight: 800; color: #D9FF00; letter-spacing: 8px; padding: 24px; text-align: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; margin: 24px 0;">
          ${code}
        </div>
        <p>Este código expira em 10 minutos. Se não foi você quem solicitou, recomendamos alterar sua senha imediatamente.</p>`;
      return {
        subject,
        html: masterEmailLayout({ theme: 'GOLD', companyName: cn, headline: 'Verificação 2FA', bodyHtml: body }),
        text: `${subject}: ${code}`,
      };
    }
    case 'new_login': {
      const subject = `Novo login detectado — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Detectamos um novo acesso à sua conta em <strong>${vars.date || new Date().toLocaleString()}</strong>.</p>
        <p style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
          <strong>Local:</strong> ${vars.location || 'Desconhecido'}<br/>
          <strong>Dispositivo:</strong> ${vars.device || 'Desconhecido'}
        </p>
        <p>Se foi você, pode ignorar este alerta. Caso contrário, bloqueie sua conta agora.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'GOLD',
          companyName: cn,
          headline: 'Alerta de Segurança',
          bodyHtml: body,
          ctaLabel: 'Não fui eu',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'payment_failed': {
      const subject = `Falha no pagamento — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Não conseguimos processar a cobrança do seu plano em <strong>${cn}</strong>.</p>
        <p>Para evitar a suspensão dos serviços, verifique seu método de pagamento no painel financeiro.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'GOLD',
          companyName: cn,
          headline: 'Pagamento recusado',
          bodyHtml: body,
          ctaLabel: 'Regularizar agora',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'invoice_overdue': {
      const subject = `Fatura pendente — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Identificamos que sua fatura no valor de <strong style="color:#ef4444;">${vars.amount || '—'}</strong> está vencida.</p>
        <p>Evite o bloqueio das funcionalidades do sistema realizando o pagamento hoje.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'RUBI',
          companyName: cn,
          headline: 'Fatura Vencida',
          bodyHtml: body,
          ctaLabel: 'Gerar 2ª via',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'limit_reached': {
      const subject = `Limite atingido — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Você atingiu o limite de <strong>${vars.limit_name || 'uso'}</strong> do seu plano atual.</p>
        <p>Para continuar utilizando todos os recursos sem interrupções, considere realizar um upgrade.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'SAFIRA',
          companyName: cn,
          headline: 'Alerta de Uso',
          bodyHtml: body,
          ctaLabel: 'Ver planos',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'new_lead': {
      const subject = `Novo Lead Recebido! — ${cn}`;
      const body = `<p>Parabéns!</p>
        <p>Um novo lead acabou de chegar através do seu canal de captação.</p>
        <div style="background: rgba(217,255,0,0.05); padding: 20px; border-radius: 16px; border: 1px solid rgba(217,255,0,0.1);">
          <p style="margin: 0;"><strong>Nome:</strong> ${vars.lead_name || '—'}<br/>
          <strong>Interesse:</strong> ${vars.interest || '—'}</p>
        </div>
        <p>Recomendamos o contato em menos de 5 minutos para aumentar a chance de conversão.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'GOLD',
          companyName: cn,
          headline: 'Nova Oportunidade',
          bodyHtml: body,
          ctaLabel: 'Ver no CRM',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'new_company': {
      const subject = `Nova empresa cadastrada — HUB`;
      const body = `<p>Um novo parceiro acaba de se registrar no ecossistema.</p>
        <div style="background: rgba(239,68,68,0.05); padding: 20px; border-radius: 16px; border: 1px solid rgba(239,68,68,0.1);">
          <p style="margin:0;"><strong>Empresa:</strong> ${vars.target_company_name || '—'}<br/>
          <strong>Plano:</strong> ${vars.plan || '—'}</p>
        </div>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'RUBI',
          companyName: 'Logta Hub',
          headline: 'Novo Cadastro',
          bodyHtml: body,
          ctaLabel: 'Gerenciar no Master',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'system_error': {
      const subject = `ALERTA CRÍTICO: Erro no Sistema — HUB`;
      const body = `<p>Detectamos uma falha crítica que requer atenção imediata.</p>
        <div style="background: rgba(239,68,68,0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(239,68,68,0.2); font-family: monospace; font-size: 13px; color: #ef4444;">
          <strong>Serviço:</strong> ${vars.service || 'Geral'}<br/>
          <strong>Erro:</strong> ${vars.error_msg || 'Erro desconhecido'}
        </div>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'RUBI',
          companyName: 'Logta Hub',
          headline: 'Falha detectada',
          bodyHtml: body,
        }),
        text: subject,
      };
    }
    case 'password_reset': {
      const subject = `Redefinição de senha — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Se foi você, clique no botão abaixo para escolher uma nova senha:</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: cn.toLowerCase().includes('hub') ? 'RUBI' : cn.toLowerCase().includes('logta') ? 'SAFIRA' : 'GOLD',
          companyName: cn,
          headline: 'Recuperar Acesso',
          bodyHtml: body,
          ctaLabel: 'Redefinir Senha',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'account_activation': {
      const subject = `Ative sua conta — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Sua conta na plataforma <strong>${cn}</strong> está quase pronta.</p>
        <p>Clique no botão abaixo para confirmar seu e-mail e ativar todos os recursos.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: cn.toLowerCase().includes('hub') ? 'RUBI' : cn.toLowerCase().includes('logta') ? 'SAFIRA' : 'GOLD',
          companyName: cn,
          headline: 'Bem-vindo(a)!',
          bodyHtml: body,
          ctaLabel: 'Ativar Minha Conta',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'subscription_cancelled': {
      const subject = `Assinatura cancelada — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Confirmamos o cancelamento da sua assinatura em <strong>${cn}</strong>.</p>
        <p>Seus recursos premium permanecerão ativos até o final do ciclo atual. Sentiremos sua falta!</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'RUBI',
          companyName: cn,
          headline: 'Cancelamento Confirmado',
          bodyHtml: body,
          ctaLabel: 'Reativar Plano',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'refund_processed': {
      const subject = `Reembolso processado — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>O reembolso referente à sua transação em <strong>${cn}</strong> foi processado com sucesso.</p>
        <p>O valor deve aparecer na sua fatura ou conta em breve, dependendo do seu banco.</p>`;
      return {
        subject,
        html: masterEmailLayout({ theme: 'GOLD', companyName: cn, headline: 'Reembolso Efetuado', bodyHtml: body }),
        text: subject,
      };
    }
    case 'low_balance': {
      const subject = `Saldo baixo detectado — ${cn}`;
      const body = `<p>Atenção, <strong>${esc(name)}</strong>.</p>
        <p>O saldo de créditos da sua conta está abaixo do limite recomendado.</p>
        <p>Para evitar a interrupção de envios ou rotas, recarregue seu saldo agora.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'GOLD',
          companyName: cn,
          headline: 'Alerta de Créditos',
          bodyHtml: body,
          ctaLabel: 'Recarregar Agora',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'new_comment': {
      const subject = `Novo comentário em sua demanda — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p><strong>${vars.author || 'Alguém'}</strong> comentou no card que você está acompanhando:</p>
        <div style="font-style: italic; color: #94a3b8; padding: 16px; border-left: 4px solid #6366f1; background: rgba(99,102,241,0.05); margin: 20px 0;">
          "${vars.comment || '...'}"
        </div>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'GOLD',
          companyName: cn,
          headline: 'Nova Interação',
          bodyHtml: body,
          ctaLabel: 'Ver Comentário',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'appointment_reminder': {
      const subject = `Lembrete: Reunião agendada — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Passando para lembrar da nossa reunião agendada para:</p>
        <div style="font-size: 20px; font-weight: 700; color: #D9FF00; margin: 20px 0;">
          ${vars.date_time || 'Horário agendado'}
        </div>
        <p>Prepare suas dúvidas e nos vemos lá!</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'GOLD',
          companyName: cn,
          headline: 'Lembrete de Agenda',
          bodyHtml: body,
          ctaLabel: 'Entrar na Sala',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'infra_alert': {
      const subject = `[ALERTA INFRA] ${vars.severity || 'INFO'}: ${vars.resource || 'Sistema'}`;
      const body = `<p>Monitoramento detectou uma instabilidade no recurso: <strong>${vars.resource || 'Geral'}</strong>.</p>
        <div style="background: rgba(239,68,68,0.1); padding: 20px; border-radius: 12px; color: #ef4444; font-family: monospace;">
          <strong>Métrica:</strong> ${vars.metric || 'Desconhecida'}<br/>
          <strong>Valor:</strong> ${vars.value || '0'}
        </div>`;
      return {
        subject,
        html: masterEmailLayout({ theme: 'RUBI', companyName: 'Master Hub', headline: 'Monitoramento HQ', bodyHtml: body }),
        text: subject,
      };
    }
    case 'backup_success': {
      const subject = `Backup concluído com sucesso — Hub`;
      const body = `<p>O backup diário de todas as instâncias foi finalizado.</p>
        <p><strong>Tamanho:</strong> ${vars.size || '—'}<br/>
        <strong>Destino:</strong> ${vars.storage || 'AWS S3 Cloud'}</p>`;
      return {
        subject,
        html: masterEmailLayout({ theme: 'RUBI', companyName: 'Master Hub', headline: 'Segurança de Dados', bodyHtml: body }),
        text: subject,
      };
    }
    case 'route_completed': {
      const subject = `Rota finalizada com sucesso! — ${cn}`;
      const body = `<p>Informamos que a rota <strong>#${vars.route_id || '—'}</strong> foi concluída.</p>
        <p>Todas as entregas foram realizadas e o motorista já está em standby.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'SAFIRA',
          companyName: cn,
          headline: 'Logística Concluída',
          bodyHtml: body,
          ctaLabel: 'Ver Relatório',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'cargo_delayed': {
      const subject = `Aviso de atraso na entrega — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Identificamos um atraso na carga <strong>#${vars.cargo_id || '—'}</strong> devido a imprevistos na rota.</p>
        <p>Nova previsão de entrega: <strong style="color: #38bdf8;">${vars.new_eta || 'A definir'}</strong>.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'SAFIRA',
          companyName: cn,
          headline: 'Alerta de Logística',
          bodyHtml: body,
          ctaLabel: 'Rastrear Agora',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'billing_due_soon': {
      const subject = `Lembrete de renovação — ${cn}`;
      const dueDate = vars.dueDate ? String(vars.dueDate) : 'em breve';
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Sua assinatura na plataforma <strong>${cn}</strong> vence no dia <strong>${dueDate}</strong>.</p>
        <p>Já deixamos a cobrança pronta para você. Mantenha seu fluxo de trabalho sem interrupções realizando o pagamento agora.</p>
        <div style="background: rgba(56,189,248,0.05); padding: 20px; border-radius: 16px; border: 1px solid rgba(56,189,248,0.1); margin: 24px 0;">
          <p style="margin: 0;"><strong>Valor:</strong> ${vars.amount || '—'}<br/>
          <strong>Método:</strong> ${vars.method || 'PIX'}</p>
        </div>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'SAFIRA',
          companyName: cn,
          headline: 'Próximo Vencimento',
          bodyHtml: body,
          ctaLabel: 'Pagar Agora',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'billing_overdue_recovery': {
      const subject = `Importante: Pendência financeira — ${cn}`;
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Notamos que sua última fatura ainda não foi identificada no sistema.</p>
        <p>Para evitar a suspensão dos seus serviços e garantir a continuidade das suas operações, regularize sua situação hoje mesmo.</p>
        <p>Se tiver qualquer dúvida ou precisar de ajuda com o pagamento, responda a este e-mail.</p>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'RUBI',
          companyName: cn,
          headline: 'Pagamento Pendente',
          bodyHtml: body,
          ctaLabel: 'Regularizar Agora',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    case 'growth_invitation': {
      const subject = `Indique um amigo e ganhe benefícios — ${cn}`;
      const reward = vars.reward_type === 'DISCOUNT' ? 'desconto na mensalidade' : 'crédito em conta';
      const body = `<p>Olá, <strong>${esc(name)}</strong>.</p>
        <p>Vimos que você está aproveitando ao máximo a plataforma <strong>${cn}</strong>, e adoraríamos ter mais parceiros como você no nosso ecossistema.</p>
        <p>Indique um amigo usando seu link exclusivo e, assim que ele ativar a conta, você ganha <strong>${reward}</strong> como agradecimento.</p>
        <div style="background: rgba(217,255,0,0.05); padding: 24px; border-radius: 16px; border: 1px dashed rgba(217,255,0,0.3); text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8;">Seu link exclusivo:</p>
          <strong style="color: #D9FF00; font-size: 16px;">${vars.referral_link || '—'}</strong>
        </div>`;
      return {
        subject,
        html: masterEmailLayout({
          theme: 'GOLD',
          companyName: cn,
          headline: 'Cresça Conosco',
          bodyHtml: body,
          ctaLabel: 'Copiar Link',
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
    default: {
      const subject = vars.subject ? String(vars.subject) : `Notificação — ${cn}`;
      return {
        subject,
        html: masterEmailLayout({
          theme: cn.toLowerCase().includes('hub') ? 'RUBI' : cn.toLowerCase().includes('logta') ? 'SAFIRA' : 'GOLD',
          companyName: cn,
          headline: vars.headline ? String(vars.headline) : 'Informativo',
          bodyHtml: vars.body ? String(vars.body) : '<p>Você tem uma nova notificação do sistema.</p>',
          ctaLabel: typeof vars.ctaLabel === 'string' ? vars.ctaLabel : undefined,
          ctaUrl: typeof vars.ctaUrl === 'string' ? vars.ctaUrl : undefined,
        }),
        text: subject,
      };
    }
  }
}
