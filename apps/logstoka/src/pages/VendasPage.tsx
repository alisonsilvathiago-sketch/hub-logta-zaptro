import { LOGSTOKA_AI_BRAND } from '@/modules/ai/constants';
import React, { useState, useEffect } from 'react';
import {
  Truck,
  ArrowRight,
  Shield,
  Plus,
  Check,
  Star,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Info,
  Heart,
  Users,
  Clock,
  BarChart3,
  PieChart,
  Link2,
  Package,
  Sparkles,
} from 'lucide-react';

import vendasHeroContainers from '@/assets/vendas-hero-containers.png';
import vendasConfiancaApp from '@/assets/vendas-confianca-app-v2.png';
import { buildHubLoginUrl } from '@/lib/hubAuth';

const whyChooseCards = [
  {
    Icon: Package,
    badge: 'SKUs ativos',
    stat: '120K+',
    desc: 'Produtos monitorados em operações reais de e-commerce e marketplaces com rastreio por depósito.',
  },
  {
    Icon: Clock,
    badge: 'Uptime',
    stat: '99%',
    desc: 'Alta disponibilidade para entradas, saídas e inventário sem travar no pico de vendas.',
  },
  {
    Icon: BarChart3,
    badge: 'Movimentações',
    stat: '50M+',
    desc: 'Volume processado em fluxos de estoque, devoluções e transferências com histórico auditável.',
  },
] as const;

/** Inline marks for the hero gradient trust strip (no image background — sits on section gradient). */
const trustStripLogos = [
  {
    name: 'Hitech',
    mark: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 md:h-9 md:w-9 shrink-0" aria-hidden>
        <path
          fill="#a78bfa"
          d="M6 4h3.2v7.2H6V4zm4.8 0H18v2.8h-3.5v4.4H18V20h-3.2v-5.2h-3.2V20H8.4V4z"
        />
      </svg>
    ),
  },
  {
    name: 'Penta',
    mark: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 md:h-9 md:w-9 shrink-0" aria-hidden>
        <path
          fill="#7dd3fc"
          d="M12 3l7.2 5.2v7.6L12 21l-7.2-5.2V8.2L12 3zm0 3.2L7.8 9.1v5.8L12 18.8l4.2-3.9V9.1L12 6.2z"
        />
      </svg>
    ),
  },
  {
    name: 'Chain',
    mark: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 md:h-9 md:w-9 shrink-0" aria-hidden>
        <path
          fill="#2dd4bf"
          fillRule="evenodd"
          d="M4 8h3v8H4V8zm6.5 0h3v8h-3V8zm6.5 0h3v8h-3V8zM7 11.5h2.5v1H7v-1zm6.5 0H16v1h-2.5v-1z"
        />
      </svg>
    ),
  },
  {
    name: 'Border',
    mark: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 md:h-9 md:w-9 shrink-0" aria-hidden>
        <path fill="#60a5fa" d="M5 5h9v9H5V5zm2 2v5h5V7H7zm5 5h7v7h-7v-7zm2 2v3h3v-3h-3z" />
      </svg>
    ),
  },
  {
    name: 'hues',
    mark: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 md:h-9 md:w-9 shrink-0" aria-hidden>
        <circle cx="9" cy="11" r="5" fill="#f87171" />
        <circle cx="15" cy="11" r="5" fill="#c084fc" />
        <circle cx="12" cy="15" r="5" fill="#4ade80" />
      </svg>
    ),
  },
  {
    name: 'Colab',
    mark: (
      <svg viewBox="0 0 24 24" className="h-8 w-8 md:h-9 md:w-9 shrink-0" aria-hidden>
        <path fill="#38bdf8" d="M12 3l8 9-8 9-8-9 8-9zm0 4.2L7.8 12 12 16.8 16.2 12 12 7.2z" />
      </svg>
    ),
  },
] as const;

/** Preto + laranja (identidade LogStoka). */
const brandIconSurface = 'bg-black shadow-sm border border-orange-600/40';
const brandButton = 'bg-orange-600 shadow-lg shadow-orange-950/35 border border-orange-700/40 hover:bg-orange-500 text-white';

const VendasPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [yearly, setYearly] = useState(false);

  const goHub = (mode: 'login' | 'register' = 'register') => {
    if (mode === 'login') {
      window.location.href = '/login';
      return;
    }
    window.location.href = buildHubLoginUrl(mode);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    document.body.classList.add('hide-scrollbar', 'logstoka-vendas-page');
    document.documentElement.classList.add('hide-scrollbar');
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('hide-scrollbar', 'logstoka-vendas-page');
      document.documentElement.classList.remove('hide-scrollbar');
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const faqItems = [
    {
      q: 'O LogStoka substitui meu ERP ou WMS atual?',
      a: 'Atua como WMS multicanal ou integra ao que você já usa. Muitos clientes começam por estoque, marketplaces e inventário.',
    },
    {
      q: 'Há período de teste ou homologação?',
      a: 'Sim. Conta de avaliação via HUB para importar dados e validar fluxos antes da produção.',
    },
    {
      q: 'Como funciona a IA operacional?',
      a: `${LOGSTOKA_AI_BRAND} consulta estoque, devoluções e reposição em tempo real — copiloto em todas as telas.`,
    },
    {
      q: 'Como ficam segurança e dados?',
      a: 'Autenticação centralizada na HUB, controle por perfil e auditoria de movimentações.',
    },
  ];

  const planFeatures = {
    starter: ['1 depósito', 'Importação CSV/XML', 'Dashboard operacional', 'Relatórios essenciais', 'Suporte por e-mail'],
    pro: ['Multi depósitos', `OCR + ${LOGSTOKA_AI_BRAND}`, 'Webhooks marketplaces', 'Inventário inteligente', 'API REST', 'Suporte prioritário'],
    enterprise: ['Multi empresas', 'SLA dedicado', 'Ambiente dedicado (sob consulta)', 'Customizações', 'Success manager'],
  };

  const price = (monthly: number) => {
    if (!yearly) return monthly;
    return Math.round(monthly * 10) / 12;
  };

  return (
    <div className="logstoka-vendas-page h-screen overflow-y-auto bg-[#F3F4F6] text-gray-900 font-sans selection:bg-orange-500/25 overflow-x-hidden">
      {/* Header — layout Finmax: logo | nav central | pill branco */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-16 md:h-[72px] px-4 sm:px-6 lg:px-10 flex items-center">
          <div className="flex-1 flex justify-start min-w-0">
            <button
              type="button"
              onClick={() => scrollTo('top')}
              className="flex items-center gap-3 text-left cursor-pointer shrink-0"
              aria-label="LogStoka — início"
            >
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-orange-600 text-white shrink-0">
                <Truck size={20} strokeWidth={2.2} />
              </span>
              <span className="flex items-start text-lg sm:text-xl font-extrabold text-white tracking-[-0.04em] leading-none">
                LogStoka
                <sup className="ml-1 mt-1 text-[0.45rem] sm:text-[0.5rem] font-extrabold leading-none">®</sup>
              </span>
            </button>
          </div>

          <nav className="hidden xl:flex flex-1 justify-center items-center gap-7 xl:gap-9 text-[13px] font-semibold text-white/85">
            <button type="button" onClick={() => scrollTo('top')} className="hover:text-white transition-colors">
              Home
            </button>
            <button type="button" onClick={() => scrollTo('depoimentos')} className="hover:text-white transition-colors">
              About
            </button>
            <button type="button" onClick={() => scrollTo('recursos')} className="hover:text-white transition-colors">
              Features
            </button>
            <button type="button" onClick={() => scrollTo('precos')} className="hover:text-white transition-colors">
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollTo('faq')}
              className="inline-flex items-center gap-1 hover:text-white transition-colors"
            >
              Others
              <ChevronDown size={14} className="opacity-80" strokeWidth={2.5} />
            </button>
          </nav>

          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => goHub('register')}
                className="rounded-full bg-white text-black px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold hover:bg-white/90 transition-colors shadow-sm whitespace-nowrap inline-flex items-center gap-2"
              >
                Começar
                <ArrowRight size={16} strokeWidth={2.75} className="shrink-0" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => goHub('login')}
                className="text-xs sm:text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      <div id="top" className="sr-only" aria-hidden />

      {/* Hero — fundo #000, tipografia e CTAs */}
      <section className="relative z-20 isolate min-h-[1000px] lg:min-h-[1200px] bg-black text-white px-0 overflow-hidden" style={{ paddingTop: '190px', paddingBottom: '112px' }}>
        <div className="relative z-[1] mx-auto w-full max-w-7xl text-center px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <h1 className="box-content text-4xl leading-tight sm:text-5xl md:text-6xl lg:text-[64px] font-bold tracking-[-0.02em] py-2 mt-6 mb-8 h-auto overflow-visible bg-gradient-to-r from-white via-white to-orange-400 bg-clip-text !text-transparent">
            Controle seu estoque
            <br />
            <em className="italic font-black">sem planilhas</em>.
          </h1>
          <p className="mt-4 text-base sm:text-lg md:text-xl text-white/75 font-medium max-w-2xl mx-auto leading-relaxed px-4 sm:px-8 md:px-10">
            Entradas, saídas, inventários, devoluções e marketplaces num WMS com {LOGSTOKA_AI_BRAND}.
          </p>
          <div className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => goHub('register')}
              className="rounded-full bg-orange-500 px-7 sm:px-9 py-3 sm:py-3.5 text-sm font-bold text-black hover:bg-orange-400 transition-colors shadow-[0_0_24px_-4px_rgba(234,88,12,0.55)]"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => scrollTo('precos')}
              className="rounded-full border border-white/25 bg-white/[0.06] px-7 sm:px-9 py-3 sm:py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* Mockup + cards flutuantes (tons escuros como referência) */}
        <div
          id="demo"
          className="relative z-[1] mx-auto mt-16 max-w-5xl w-full px-4 scroll-mt-28 flex justify-center overflow-visible"
        >
          <img
            src={vendasHeroContainers}
            alt="Operação logística LogStoka — estoque e armazém"
            className="box-content block max-w-full h-auto w-auto max-h-[500px] md:max-h-[600px] object-contain object-center origin-center"
            decoding="async"
            loading="lazy"
          />

          {/* Pill topo-esquerdo: tendência */}
          <div className="absolute left-[2%] sm:left-[6%] md:left-[8%] top-[0%] md:top-[2%] z-20 hidden sm:flex">
            <div className="flex items-center gap-2 rounded-full bg-[#141414] border border-white/10 px-3.5 py-2 shadow-xl">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-black">
                <ArrowUp size={14} strokeWidth={3} />
              </span>
              <span className="text-sm font-bold text-orange-400 tabular-nums">347.23%</span>
            </div>
          </div>

          {/* Card meio-esquerdo: Total Income */}
          <div className="absolute left-0 sm:left-[2%] md:left-[4%] top-[26%] md:top-[30%] z-20 w-[158px] sm:w-[180px] md:w-[200px] hidden sm:block">
            <div className="rounded-2xl bg-[#161616] border border-white/10 px-3.5 sm:px-4 py-[19px] h-[104px] flex flex-col justify-center items-start align-top text-left shadow-[0px_0px_0px_0px_rgba(0,0,0,0),0px_0px_0px_0px_rgba(0,0,0,0),0px_0px_0px_0px_rgba(0,0,0,0),0px_25px_50px_-12px_rgba(0,0,0,0.25),0px_4px_12px_0px_rgba(0,0,0,0.15)]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold text-white/55">Total Income</p>
                <Info size={14} className="text-orange-400 shrink-0" strokeWidth={2.5} />
              </div>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">$234.98K</p>
              <p className="mt-1.5 text-xs font-bold text-orange-400 tabular-nums">234.45%</p>
            </div>
          </div>

          {/* Card topo-direito */}
          <div className="absolute right-0 sm:right-[2%] md:right-[6%] top-[4%] md:top-[8%] z-20 w-[158px] sm:w-[180px] md:w-[200px] hidden sm:block">
            <div className="rounded-2xl bg-[#161616] border border-white/10 px-3.5 sm:px-4 py-[19px] h-[104px] flex flex-col justify-center items-start align-top text-left shadow-[0px_0px_0px_0px_rgba(0,0,0,0),0px_0px_0px_0px_rgba(0,0,0,0),0px_0px_0px_0px_rgba(0,0,0,0),0px_25px_50px_-12px_rgba(0,0,0,0.25),0px_4px_12px_0px_rgba(0,0,0,0.15)]">
              <p className="text-[11px] font-semibold text-white/55">Total Income</p>
              <p className="mt-2 text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">$567.34K</p>
            </div>
          </div>

          {/* Pill inferior-direito: social proof */}
          <div className="absolute right-[2%] md:right-[10%] bottom-[8%] md:bottom-[12%] z-20 hidden md:flex">
            <div className="flex h-[47px] items-center justify-center gap-3 rounded-full bg-[#141414] border border-white/10 pl-2 pr-4 py-1.5 shadow-xl">
              <div className="flex -space-x-2">
                {['bg-amber-200', 'bg-sky-300', 'bg-violet-300'].map((c) => (
                  <span
                    key={c}
                    className={`h-8 w-8 rounded-full border-2 border-[#141414] ${c}`}
                  />
                ))}
              </div>
              <Heart size={16} className="text-orange-400 fill-orange-400/20" strokeWidth={2} />
              <span className="text-sm font-bold text-white tabular-nums">12k+</span>
            </div>
          </div>
        </div>

      </section>

      {/* Transição visual preto → laranja → branco (#F3F4F6) + faixa de logos */}
      <section
        className="relative z-0 flex min-h-[378px] items-center justify-center px-4 pt-[85px] pb-10 md:pb-12 bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(17,24,39,1)_14%,rgba(194,65,12,1)_32%,rgba(234,88,12,1)_46%,rgba(251,146,60,1)_58%,rgba(255,237,213,1)_72%,rgba(255,255,255,1)_84%,rgba(243,244,246,1)_100%)]"
        aria-label="Empresas que confiam na LogStoka"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center gap-8 md:gap-10 py-0">
          <p className="text-center text-sm font-medium text-white/65 md:text-[0.9375rem]">
            More than 25,000 teams use LogStoka
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 md:gap-x-10 list-none m-0 p-0">
            {trustStripLogos.map(({ name, mark }) => (
              <li key={name} className="flex items-center gap-3">
                {mark}
                <span className="text-[27px] font-bold tracking-tight text-white">{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recursos — headline + mock + texto (referência; acentos em primary/azul) */}
      <section id="recursos" className="relative isolate z-10 scroll-mt-24 py-1.5 px-5 md:px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-[43px] font-bold !text-gray-900 tracking-[-1.3px] leading-tight md:leading-[48px] h-auto mx-4 sm:mx-[63px]">
              Menos ruptura de estoque, mais lucro na operação.
            </h2>
            <p className="mt-4 h-auto text-gray-600 font-medium leading-relaxed text-sm md:text-base">
              Uma plataforma pensada para quem precisa de clareza no armazém — sem abrir dez planilhas
              para fechar o inventário.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {whyChooseCards.map(({ Icon, badge, stat, desc }, cardIndex) => (
              <div
                key={badge}
                className="rounded-3xl bg-white border border-gray-200 p-6 md:p-8 text-left shadow-sm"
              >
                <div
                  className={
                    cardIndex === 1
                      ? 'inline-flex items-center gap-2 rounded-full bg-[rgb(5,150,105)] px-3 py-[11px] w-[145px] text-white mb-6'
                      : 'inline-flex items-center gap-2 rounded-full bg-[rgb(5,150,105)] px-3 py-1.5 text-white mb-6'
                  }
                >
                  <Icon size={16} strokeWidth={2.25} className="shrink-0" aria-hidden />
                  <span className="text-xs font-bold tracking-tight">{badge}</span>
                </div>
                <p
                  className={`text-3xl md:text-[50px] text-gray-900 tracking-tight tabular-nums ${
                    cardIndex === 0 ? 'font-bold' : 'font-black'
                  }`}
                >
                  {stat}
                </p>
                <p className="mt-4 text-sm text-gray-600 font-medium leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Mockup + texto (referência Finmax; gradientes azul/branco) */}
          <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center justify-center">
            <div className="rounded-[2rem] bg-gray-100 border border-gray-200/90 p-6 md:p-8 shadow-inner h-auto min-h-[520px]">
              <div className="rounded-2xl bg-white border border-gray-100 p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${brandIconSurface} text-white`}
                  >
                    <ArrowUp size={18} strokeWidth={2.5} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Gastos</p>
                    <p className="text-lg font-bold text-gray-900 tabular-nums tracking-tight">R$ 3.695,06</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${brandIconSurface} text-white`}
                  >
                    <ArrowDown size={18} strokeWidth={2.5} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Recebido</p>
                    <p className="text-lg font-bold text-gray-900 tabular-nums tracking-tight">R$ 95.295,06</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${brandIconSurface} text-white`}
                  >
                    <Plus size={18} strokeWidth={2.5} aria-hidden />
                  </span>
                  <p className="text-sm font-bold text-gray-800">Adicionar</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-5 md:p-6">
                <svg width="0" height="0" className="absolute" aria-hidden>
                  <defs>
                    <linearGradient id="vendas-recursos-star-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#C2410C" />
                      <stop offset="45%" stopColor="#EA580C" />
                      <stop offset="55%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#D1FAE5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      className="shrink-0"
                      fill="url(#vendas-recursos-star-grad)"
                      stroke="#EA580C"
                      strokeWidth={1.25}
                      aria-hidden
                    />
                  ))}
                  <span className="ml-1 text-xs font-black text-gray-900 uppercase tracking-tight">Top rated</span>
                </div>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Uma solução bem desenhada e confiável que simplifica a gestão financeira e apoia o crescimento. Interface
                  limpa, recursos fortes e ótima usabilidade.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-white shadow-sm"
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Esther Howard</p>
                    <p className="text-xs font-semibold text-gray-500">Cliente LogStoka</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${brandIconSurface} text-white`}
                  >
                    <ArrowLeftRight size={18} strokeWidth={2.5} aria-hidden />
                  </span>
                  <p className="text-sm font-bold text-gray-900 truncate">Transações recentes</p>
                </div>
                <div className="flex -space-x-2 shrink-0 pl-2">
                  {['bg-sky-200', 'bg-violet-200', 'bg-amber-100'].map((c) => (
                    <span
                      key={c}
                      className={`h-8 w-8 rounded-full border-2 border-white ${c}`}
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-left">
              <h3 className="text-3xl md:text-[2.125rem] font-bold !text-gray-900 tracking-tight leading-tight">
                Assuma o controle do seu estoque com liberdade de verdade.
              </h3>
              <p className="mt-4 text-gray-600 font-medium leading-relaxed text-sm md:text-base">
                Centralize entradas, saídas, picking e inventário num só lugar. Menos planilhas, mais precisão
                multicanal.
              </p>

              <div className="mt-8 space-y-0">
                <div className="flex gap-4 py-6">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${brandIconSurface} text-white`}
                  >
                    <PieChart size={22} strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-base font-bold text-gray-900">Controle de estoque</p>
                    <p className="mt-1 text-sm text-gray-600 font-medium leading-relaxed">
                      Saldo por SKU, depósito e marketplace em tempo real, com histórico auditável.
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-200" />
                <div className="flex gap-4 py-6">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${brandIconSurface} text-white`}
                  >
                    <Link2 size={22} strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-base font-bold text-gray-900">Integração multicanal</p>
                    <p className="mt-1 text-sm text-gray-600 font-medium leading-relaxed">
                      Escale marketplaces e webhooks conforme sua operação — Shopee, ML, Amazon e mais.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => goHub('register')}
                className={`mt-4 w-full sm:w-auto rounded-full px-10 py-4 text-sm font-bold text-white transition-[filter] ${brandButton}`}
              >
                Começar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Confiança — duas colunas com fotografia (logística + app) */}
      <section
        id="confianca"
        aria-labelledby="confianca-heading"
        className="scroll-mt-24 bg-[#F3F4F6] py-16 md:py-24 px-5 md:px-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2
              id="confianca-heading"
              className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold !text-gray-900 tracking-tight leading-tight"
            >
              Sua operação de estoque inteira em uma única tela inteligente.
            </h2>
            <p className="mt-4 text-base md:text-lg text-gray-600 font-medium leading-relaxed">
              Conte com o LogStoka para extrair o máximo do armazém — do picking ao inventário, com histórico claro e
              indicadores que o time realmente usa.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-stretch">
            {/* Card — logística / frota */}
            <div className="rounded-[2rem] bg-gray-100 border border-[rgba(52,211,153,0.9)] p-6 md:p-8 flex flex-col shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold !text-gray-900 tracking-tight">
                Indicadores de estoque à mão
              </h3>
              <p className="mt-3 text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                Operações de e-commerce destacam visão unificada de depósitos e SKUs, com menos retrabalho entre times.
              </p>
              <div className="mt-6 flex-1 rounded-2xl bg-white border border-gray-100 p-8 shadow-sm flex flex-col justify-between text-left">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Monitoramento Ativo</span>
                    </div>
                    <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-[9px] font-black uppercase tracking-normal">Em Rota</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Pedido marketplace</p>
                    <p className="text-sm font-extrabold text-gray-900">Shopee #88421 — 12 itens</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Depósito</p>
                      <p className="text-xs font-bold text-gray-800">CD Guarulhos</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Status</p>
                      <p className="text-xs font-bold text-gray-800">Separação ativa</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Saldo SKU principal</span>
                  <span className="text-xl font-black text-orange-600">1.248 un.</span>
                </div>
              </div>
            </div>

            {/* Card — app LogStoka */}
            <div className="rounded-[2rem] bg-gray-100 border border-[rgba(16,185,129,0.9)] p-6 md:p-8 flex flex-col shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold !text-gray-900 tracking-tight">
                Visão que reduz risco na operação
              </h3>
              <p className="mt-3 text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                Indicadores, fretes e documentos acessíveis num fluxo contínuo — sem saltar entre sistemas legados.
              </p>
              <div className="mt-6 flex-1 rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                <img
                  src={vendasConfiancaApp}
                  alt="Smartphone exibindo o aplicativo LogStoka"
                  className="w-full h-[280px] sm:h-[320px] md:h-[378px] object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section
        id="depoimentos"
        className="scroll-mt-24 py-16 md:py-24 px-5 md:px-8 bg-gray-100 border-y border-[rgba(243,244,246,1)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl md:text-4xl font-black !text-gray-900">O que dizem os usuários</h2>
          <p className="text-center text-gray-500 font-medium mt-3 max-w-xl mx-auto">
            Times de e-commerce que reduziram ruptura e ganharam visão de estoque.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Mariana Alves',
                role: 'COO, Loja Horizonte',
                text: 'Unificamos Shopee e ML num só WMS. O board enxerga saldo por SKU em tempo real.',
              },
              {
                name: 'Ricardo Mendes',
                role: 'Diretor Operações',
                text: 'Onboarding rápido. Em seis semanas já tínhamos inventário cíclico e OCR de relatórios.',
              },
              {
                name: 'Paula Nogueira',
                role: 'Head de Supply',
                text: 'Reposição sugerida pela IA cortou ruptura nos produtos A.',
              },
            ].map((t) => (
              <div key={t.name} className="rounded-3xl border border-gray-100 bg-gray-50/80 p-6 text-left">
                <div className="flex gap-1 text-orange-600 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} className="fill-orange-600 text-orange-600" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-4 text-sm font-black text-gray-900">{t.name}</p>
                <p className="text-xs text-orange-600 font-bold">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="scroll-mt-24 py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black !text-gray-900">Planos claros</h2>
            <p className="mt-3 text-gray-500 font-medium">Escolha o ritmo. Fale com vendas para Enterprise.</p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-gray-200/80 p-1">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${!yearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${yearly ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30' : 'text-gray-600'}`}
              >
                Anual <span className="text-orange-100">(-2 meses)</span>
              </button>
            </div>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-6 items-stretch">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 flex flex-col">
              <p className="text-xs font-black text-gray-500 uppercase">Starter</p>
              <p className="mt-4 text-4xl font-black text-gray-900">
                R$ {price(297)}
                <span className="text-lg font-bold text-gray-500">/mês</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">Para equipes enxutas começando a padronizar.</p>
              <ul className="mt-8 space-y-3 flex-1">
                {planFeatures.starter.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Check size={18} className="text-orange-600 shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => goHub('register')}
                className="mt-8 w-full py-3.5 rounded-full border-2 border-gray-200 font-bold text-gray-900 hover:border-orange-600 hover:text-orange-600 transition-colors"
              >
                Começar
              </button>
            </div>

            <div className="rounded-3xl p-8 flex flex-col relative overflow-hidden bg-gradient-to-b from-orange-500/15 via-white to-white border-2 border-orange-600 shadow-xl shadow-orange-600/15 md:scale-[1.02]">
              <div className="absolute top-4 right-4 text-[10px] font-black uppercase bg-orange-600 text-white px-3 py-1 rounded-full">
                Popular
              </div>
              <p className="text-xs font-black text-orange-600 uppercase">Pro</p>
              <p className="mt-4 text-4xl font-black text-gray-900">
                R$ {price(697)}
                <span className="text-lg font-bold text-gray-500">/mês</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">Operação completa para transportadoras em crescimento.</p>
              <ul className="mt-8 space-y-3 flex-1">
                {planFeatures.pro.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <Check size={18} className="text-orange-600 shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => goHub('register')}
                className="mt-8 w-full py-3.5 rounded-full bg-orange-600 text-white font-bold shadow-lg shadow-orange-600/35 hover:bg-orange-600 transition-colors"
              >
                Começar no Pro
              </button>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-8 flex flex-col">
              <p className="text-xs font-black text-gray-500 uppercase">Enterprise</p>
              <p className="mt-4 text-4xl font-black text-gray-900">Sob consulta</p>
              <p className="text-sm text-gray-500 mt-1">Multi-filial, SLA e customizações.</p>
              <ul className="mt-8 space-y-3 flex-1">
                {planFeatures.enterprise.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Check size={18} className="text-orange-600 shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => scrollTo('faq')}
                className="mt-8 w-full py-3.5 rounded-full border-2 border-gray-200 font-bold text-gray-900 hover:border-orange-600 hover:text-orange-600 transition-colors"
              >
                Falar com vendas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 py-20 md:py-24 px-5 md:px-8 bg-gray-100 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl md:text-4xl font-black !text-gray-900">Perguntas frequentes</h2>
          <ul className="mt-10 space-y-3">
            {faqItems.map((item, i) => {
              const open = openFaq === i;
              return (
                <li key={item.q} className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-bold text-gray-900 text-sm sm:text-base hover:bg-white transition-colors"
                    aria-expanded={open}
                  >
                    {item.q}
                    <span
                      className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-orange-600/10 text-orange-600 transition-transform ${open ? 'rotate-45' : ''}`}
                    >
                      <Plus size={20} strokeWidth={2.5} />
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-4 text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-100">
                      <p className="pt-3">{item.a}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Footer escuro */}
      <footer className="bg-[#0a0a0b] text-gray-500 pt-16 pb-10 px-5 md:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-10">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white">
                <Truck size={18} />
              </div>
              <span className="text-lg font-black text-white">LogStoka</span>
            </div>
            <p className="text-xs font-medium text-center md:text-left max-w-xs">
              WMS multicanal em nuvem. © {new Date().getFullYear()} LogStoka. Autenticação via HUB.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-xs font-bold">
            <button type="button" onClick={() => scrollTo('recursos')} className="hover:text-white transition-colors">
              Recursos
            </button>
            <button type="button" onClick={() => scrollTo('precos')} className="hover:text-white transition-colors">
              Planos
            </button>
            <button type="button" onClick={() => goHub('login')} className="hover:text-white transition-colors">
              Login
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <Shield size={14} className="text-orange-600" />
            Dados e acesso sob contrato
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VendasPage;
