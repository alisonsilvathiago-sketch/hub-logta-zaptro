import React from 'react';
import {
  Users,
  Truck,
  Wallet,
  Car,
  MessageCircle,
  FileText,
  MapPinned,
  BarChart3,
  Plus,
} from "lucide-react";

export type EmptyStateType =
  | "clientes"
  | "financeiro"
  | "operacoes"
  | "frota"
  | "chat"
  | "documentos"
  | "rastreamento"
  | "relatorios"
  | "rh";

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  /** @deprecated Use apenas o CTA principal — uma única ação por empty state. */
  iaSuggestion?: {
    text: string;
    actionLabel: string;
    onAction: () => void;
  };
}

const emptyStates = {
  clientes: {
    title: "Você ainda não adicionou clientes",
    description: "Adicione clientes para começar seu CRM inteligente dentro da LOGTA.",
    button: "Adicionar cliente",
    icon: <Users size={40} />,
  },

  financeiro: {
    title: "Transfira e pague mais rápido",
    description: "Realize pagamentos e transferências em tempo real. Seus registros financeiros aparecerão aqui.",
    button: "Fazer transferência",
    icon: <Wallet size={40} />,
  },

  operacoes: {
    title: "Nenhuma operação criada",
    description: "Crie sua primeira operação logística e acompanhe entregas em tempo real.",
    button: "Criar operação",
    icon: <Truck size={40} />,
  },

  frota: {
    title: "Você ainda não cadastrou veículos",
    description: "Adicione veículos para começar sua gestão inteligente de frota.",
    button: "Cadastrar veículo",
    icon: <Car size={40} />,
  },

  chat: {
    title: "Nenhuma conversa encontrada",
    description: "As mensagens e atendimentos aparecerão aqui automaticamente.",
    button: "Iniciar conversa",
    icon: <MessageCircle size={40} />,
  },

  documentos: {
    title: "Nenhum documento enviado",
    description: "Envie documentos, contratos e arquivos para centralizar tudo na LOGTA.",
    button: "Enviar documento",
    icon: <FileText size={40} />,
  },

  rastreamento: {
    title: "Nenhum rastreamento ativo",
    description: "Os rastreamentos dos veículos aparecerão aqui em tempo real.",
    button: "Ativar rastreamento",
    icon: <MapPinned size={40} />,
  },

  relatorios: {
    title: "Nenhum relatório disponível",
    description: "Os relatórios inteligentes da operação aparecerão aqui.",
    button: "Gerar relatório",
    icon: <BarChart3 size={40} />,
  },

  rh: {
    title: "Nenhum colaborador cadastrado ainda",
    description:
      "Cadastre colaboradores e motoristas pelo RH. A equipe unificada aparece aqui para todos os usuários da transportadora.",
    button: "Novo colaborador",
    icon: <Users size={40} />,
  },
};

export const LogtaEmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const data = emptyStates[type];

  return (
    <div className="w-full rounded-[20px] border border-gray-100 bg-white p-12 shadow-xl shadow-gray-200/40 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-gray-400">
          {data.icon}
        </div>

        <div className="max-w-md space-y-3">
          <h2 className="logta-empty-state-title">{data.title}</h2>
          <p className="logta-empty-state-description">{data.description}</p>
        </div>

        {onAction ? (
          <button type="button" onClick={onAction} className="hub-premium-pill dark mt-8">
            <Plus size={16} />
            {data.button}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default LogtaEmptyState;
