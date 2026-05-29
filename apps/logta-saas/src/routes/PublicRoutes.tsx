import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { hasLogtaMockSession } from '../lib/authSession';

const Login = lazy(() => import('../pages/LoginModule'));
const AuthCallback = lazy(() => import('../pages/AuthCallback'));
const Registrar = lazy(() => import('../pages/RegistrarModule'));
const Vendas = lazy(() => import('../pages/Vendas'));
const PontoPublicView = lazy(() =>
  import('../modules/rh/ponto/views/PontoPublicView').then((m) => ({ default: m.PontoPublicView })),
);
const OrcamentoPublicView = lazy(() =>
  import('../modules/orcamento').then((m) => ({ default: m.OrcamentoPublicView })),
);
const MotoristaRotaPublicView = lazy(() =>
  import('../modules/motorista').then((m) => ({ default: m.MotoristaRotaPublicView })),
);
const LogtaCalculatorPublicView = lazy(() =>
  import('../views/LogtaCalculatorPublicView').then((m) => ({ default: m.LogtaCalculatorPublicView })),
);

function RootEntry() {
  if (hasLogtaMockSession()) {
    return <Navigate to="/inicio" replace />;
  }
  return <Navigate to="/login" replace />;
}

/** Rotas públicas — carregamento separado do painel (login abre rápido). */
export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootEntry />} />
      <Route path="/vendas" element={<Vendas />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registrar" element={<Registrar />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/ponto/:companySlug/:unitToken" element={<PontoPublicView />} />
      <Route path="/orcamento/publico/:token" element={<OrcamentoPublicView />} />
      <Route path="/motorista/rota/:token" element={<MotoristaRotaPublicView />} />
      <Route path="/calc/:token" element={<LogtaCalculatorPublicView />} />
    </Routes>
  );
}
