import React from 'react';
import { CreditCard, ExternalLink, Headphones, X } from 'lucide-react';
import { getHubMasterUrl } from '@/lib/hub';

type Props = {
  open: boolean;
  onDismiss?: () => void;
  mandatory?: boolean;
};

export const SubscriptionPaywallModal: React.FC<Props> = ({
  open,
  onDismiss,
  mandatory = true,
}) => {
  if (!open) return null;

  const hubPlans = `${getHubMasterUrl()}/billing`;
  const hubSupport = `${getHubMasterUrl()}/hubchat`;

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        {!mandatory && onDismiss ? (
          <button
            type="button"
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
            onClick={onDismiss}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
        <div className="px-8 pb-8 pt-10 text-center text-white">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
            <CreditCard className="h-7 w-7" />
          </div>
          <h2 id="paywall-title" className="text-2xl font-black tracking-tight">
            Seu período gratuito terminou.
          </h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-400">
            Escolha um plano para continuar usando a LOGTA com IA, LogDock Drive, automações e módulos
            premium — tudo liberado automaticamente pelo Hub após a assinatura.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={hubPlans}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              <CreditCard className="h-4 w-4" />
              Assinar agora
            </a>
            <a
              href={hubPlans}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              Ver planos
            </a>
          </div>
          <a
            href={hubSupport}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
          >
            <Headphones className="h-4 w-4" />
            Falar com suporte
          </a>
        </div>
      </div>
    </div>
  );
};
