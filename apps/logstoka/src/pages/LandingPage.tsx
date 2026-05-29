import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ScanLine, Truck, Webhook } from 'lucide-react';

const features = [
  { icon: Truck, title: 'WMS Multicanal', desc: 'Shopee, Mercado Livre, Amazon, TikTok Shop e Magalu' },
  { icon: ScanLine, title: 'Conferência & Picking', desc: 'Separação digital, leitor de código de barras e OCR' },
  { icon: Webhook, title: 'Hub Logístico API First', desc: 'REST, webhooks de entrada/saída e fila assíncrona' },
  { icon: BarChart3, title: 'Inteligência Operacional', desc: 'Curva ABC, reposição sugerida e alertas em tempo real' },
];

const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-slate-950 text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500 p-2"><Truck size={20} /></div>
        <span className="text-xl font-black">LogStoka</span>
      </div>
      <Link to="/login" className="ls-btn-primary">Entrar</Link>
    </header>

    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-400">WMS para e-commerce</p>
        <h1 className="text-4xl font-black leading-tight md:text-6xl">
          Elimine planilhas. Opere estoque multicanal com precisão.
        </h1>
        <p className="mt-6 text-lg text-slate-300">
          Entradas, saídas, transferências, devoluções, avarias, inventários e integrações — tudo conectado à HUB.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/login" className="ls-btn-primary px-6 py-3">
            Acessar sistema <ArrowRight size={16} />
          </Link>
          <a href="#features" className="ls-btn-secondary border-white/10 bg-white/5 text-white hover:bg-white/10">
            Ver recursos
          </a>
        </div>
      </div>

      <section id="features" className="mt-20 grid gap-4 md:grid-cols-2">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 inline-flex rounded-2xl bg-emerald-500/20 p-3 text-emerald-300">
              <Icon size={20} />
            </div>
            <h3 className="text-xl font-black">{title}</h3>
            <p className="mt-2 text-sm text-slate-300">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  </div>
);

export default LandingPage;
