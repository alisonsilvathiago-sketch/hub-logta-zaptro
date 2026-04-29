import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HubLogin from './hub/pages/Login';

// Master Layout & Pages
import MasterLayout from './hub/layouts/MasterLayout';
import Dashboard from './hub/modules/hub/Dashboard';
import CompanyManagement from './hub/modules/hub/Companies';
import CompanyProfile from './hub/modules/hub/CompanyProfile';
import BillingManagement from './hub/modules/hub/Billing';
import SuperAdminManagement from './hub/modules/hub/Admins';
import Settings from './hub/modules/hub/GlobalSettings';
import AccountSettings from './hub/modules/core/Profile';
import TeamHub from './hub/modules/hub/TeamHub';
import Infrastructure from './hub/modules/hub/Infrastructure';
import CRM from './hub/modules/hub/CRM';
import Agenda from './hub/modules/hub/Agenda';
import ClientsList from './hub/modules/clients/ClientsList';
import CustomerDetail from './hub/modules/hub/CustomerDetail';
import Reports from './hub/modules/hub/Reports';
import TeamMemberDetail from './hub/modules/core/MemberDetail';
import PublicCheckout from './hub/pages/PublicCheckout';
import PaymentCheckout from './hub/pages/PaymentCheckout';
import ClientBackup from './hub/pages/ClientBackup';
import HubPlans from './hub/pages/HubPlans';
import HubNotifications from './hub/pages/HubNotifications';
import HubChat from './hub/modules/hub/Chat';
import LogisticaHub from './hub/modules/hub/Logistica';
import Workflows from './hub/modules/hub/Workflows';
import PublicFuelDashboard from './hub/pages/PublicFuelDashboard';
import AnalyticalFuelDashboard from './hub/pages/AnalyticalFuelDashboard';
import ErrorBoundary from '@shared/components/ErrorBoundary';



const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HubLogin />} />
      
      {/* Rota de Checkout Público */}
      <Route path="/checkout" element={<PublicCheckout />} />
      <Route path="/play/:id" element={<PublicCheckout />} />
      <Route path="/pagar/:id" element={<PaymentCheckout />} />
      <Route path="/combustivel" element={<PublicFuelDashboard />} />
      <Route path="/fuel" element={<AnalyticalFuelDashboard />} />

      {/* Rotas do Hub Master */}
      <Route path="/master" element={
        <ErrorBoundary>
          <MasterLayout />
        </ErrorBoundary>
      }>
        {/* Core Hub Routes */}
        <Route index element={<Dashboard />} />
        
        {/* CRM Routes */}
        <Route path="crm" element={<CRM />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="hubchat" element={<HubChat />} />
        
        {/* Clients & Companies Unified */}
        <Route path="clientes" element={<ClientsList />} />
        <Route path="clientes/:id" element={<CustomerDetail />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="companies/:id" element={<CompanyProfile />} />

        {/* Financial Unified */}
        <Route path="billing/*" element={<BillingManagement />} />
        <Route path="financeiro" element={<Navigate to="/master/billing?tab=financeiro" replace />} />

        {/* Security & Infrastructure Unified */}
        <Route path="infrastructure/*" element={<Infrastructure />} />
        <Route path="backup" element={<Navigate to="/master/infrastructure?tab=backup" replace />} />
        <Route path="security" element={<Navigate to="/master/infrastructure?tab=security" replace />} />

        {/* Logistics Unified */}
        <Route path="logistica" element={<LogisticaHub />} />
        <Route path="logistica/:subPage" element={<LogisticaHub />} />
        <Route path="destinos" element={<Navigate to="/master/logistica?tab=destinos" replace />} />

        {/* Intelligence & Reports Unified */}
        <Route path="reports" element={<Reports />} />
        <Route path="intelligence" element={<Navigate to="/master/logistica?tab=inteligencia" replace />} />

        {/* Support & Admin */}
        <Route path="admins" element={<SuperAdminManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="team" element={<TeamHub />} />
        <Route path="staff" element={<Navigate to="/master/team" replace />} />
        <Route path="analytics" element={<Navigate to="/master/team?tab=performance" replace />} />
        <Route path="team/:id" element={<TeamMemberDetail />} />
        <Route path="plans" element={<HubPlans />} />
        <Route path="notifications" element={<HubNotifications />} />
        <Route path="automacoes" element={<Workflows />} />
        <Route path="integracoes" element={<Navigate to="/master/automacoes?tab=integracoes" replace />} />
        <Route path="profile" element={<AccountSettings />} />
      </Route>

      <Route path="/dashboard" element={<Navigate to="/master" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
