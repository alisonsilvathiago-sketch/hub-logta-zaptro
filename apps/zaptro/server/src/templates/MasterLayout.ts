export type ThemeType = 'GOLD' | 'RUBI' | 'SAFIRA';

export type EmailBranding = {
  theme: ThemeType;
  companyName: string;
  headline: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerExtra?: string;
};

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const THEMES = {
  GOLD: {
    accent: '#D9FF00',
    bg: '#000000',
    card: '#0a0a0a',
    text: '#f9fafb',
    muted: '#9ca3af',
    border: '#1f2937',
    label: 'ZAPTRO OPERATIONAL'
  },
  RUBI: {
    accent: '#ef4444',
    bg: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    muted: '#94a3b8',
    border: '#334155',
    label: 'HUB MASTER CONTROL'
  },
  SAFIRA: {
    accent: '#38bdf8',
    bg: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    muted: '#94a3b8',
    border: '#334155',
    label: 'LOGTA OPERATING SYSTEM'
  }
};

export function masterEmailLayout(b: EmailBranding): string {
  const theme = THEMES[b.theme] || THEMES.GOLD;
  
  const cta = b.ctaLabel && b.ctaUrl
    ? `<div style="text-align: center; margin: 32px 0;">
         <a href="${esc(b.ctaUrl)}" style="display: inline-block; padding: 16px 36px; background-color: ${theme.accent}; color: #000; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s;">
           ${esc(b.ctaLabel)}
         </a>
       </div>`
    : '';

  const footer = `
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid ${theme.border}; text-align: center;">
      <p style="margin: 0; font-size: 12px; font-weight: 700; color: ${theme.muted}; letter-spacing: 1px; text-transform: uppercase;">
        ${esc(b.companyName)} &copy; ${new Date().getFullYear()}
      </p>
      <p style="margin: 8px 0 0; font-size: 11px; color: ${theme.muted}; opacity: 0.7;">
        Este é um e-mail automático do sistema master. Não responda a esta mensagem.
      </p>
      ${b.footerExtra ? `<div style="margin-top: 12px;">${b.footerExtra}</div>` : ''}
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
    body { font-family: 'Inter', Segoe UI, sans-serif !important; }
    @media (max-width: 600px) {
      .container { padding: 16px !important; }
      .card { border-radius: 0 !important; border: none !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${theme.bg}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${theme.bg};">
    <tr>
      <td align="center" style="padding: 40px 16px;" class="container">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: ${theme.card}; border: 1px solid ${theme.border}; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);" class="card">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px;">
              <div style="display: inline-block; padding: 6px 12px; background-color: ${theme.accent}20; border-radius: 8px; font-size: 10px; font-weight: 800; color: ${theme.accent}; letter-spacing: 1.5px; margin-bottom: 20px;">
                ${theme.label}
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: ${theme.text}; line-height: 1.2; letter-spacing: -0.5px;">
                ${esc(b.headline)}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px; color: ${theme.muted}; font-size: 16px; line-height: 1.7; font-weight: 400;">
              <div style="color: ${theme.text}; opacity: 0.9;">
                ${b.bodyHtml}
              </div>
              ${cta}
              ${footer}
            </td>
          </tr>
        </table>
        
        <table role="presentation" width="100%" style="max-width: 580px; margin-top: 24px;">
           <tr>
              <td align="center" style="padding: 0 40px;">
                 <p style="font-size: 11px; color: ${theme.muted}; opacity: 0.5;">
                    Você recebeu este e-mail porque faz parte do ecossistema ${esc(b.companyName)}.<br/>
                    <a href="#" style="color: ${theme.muted}; text-decoration: underline;">Configurações de Notificação</a>
                 </p>
              </td>
           </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
