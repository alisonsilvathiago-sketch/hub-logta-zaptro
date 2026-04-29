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
import TeamManagement from './hub/modules/core/Team';
import Infrastructure from './hub/modules/hub/Infrastructure';
import BackupManagement from './hub/modules/hub/Backups';
import CustomerDetail from './hub/modules/hub/CustomerDetail';
import Agenda from './hub/modules/hub/Agenda';
import TeamMemberDetail from './hub/modules/core/MemberDetail';
import Analytics from './hub/modules/hub/Analytics';
import CRM from './hub/modules/hub/CRM';
import ClientsList from './hub/modules/clients/ClientsList';
import SecurityLogs from './hub/modules/hub/Security';
import PublicCheckout from './hub/pages/PublicCheckout';
import PaymentCheckout from './hub/pages/PaymentCheckout';
import Reports from './hub/modules/hub/Reports';
import ClientBackup from './hub/pages/ClientBackup';
import HubPlans from './hub/pages/HubPlans';
import HubNotifications from './hub/pages/HubNotifications';
import HubChat from './hub/modules/hub/Chat';
import LogisticaHub from './hub/modules/hub/Logistica';
import Workflows from './hub/modules/hub/Workflows';
import Integrations from './hub/modules/hub/Integrations';
import Destinos from './hub/modules/hub/Destinos';



const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HubLogin />} />
      
      {/* Rota de Checkout Público */}
      <Route path="/checkout" element={<PublicCheckout />} />
      <Route path="/play/:id" element={<PublicCheckout />} />
      <Route path="/pagar/:id" element={<PaymentCheckout />} />

      {/* Rotas do Hub Master */}
      <Route path="/master" element={<MasterLayout />}>
        {/* Core Hub Routes */}
        <Route index element={<Dashboard />} />
        
        {/* CRM Unified Routes (Tabs: dashboard, pipeline, calendar, flows) */}
        <Route path="crm" element={<CRM />} />
        
        {/* Agenda Standalone */}
        <Route path="agenda" element={<Agenda />} />
        
        {/* Clients Module (Standalone) */}
        <Route path="clientes" element={<ClientsList />} />
        <Route path="clientes/:id" element={<CustomerDetail />} />
        
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="companies/:id" element={<CompanyProfile />} />
        <Route path="billing/*" element={<BillingManagement />} />
        <Route path="admins" element={<SuperAdminManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="team" element={<TeamManagement />} />
        <Route path="infrastructure" element={<Infrastructure />} />
        <Route path="backup" element={<BackupManagement />} />
        
        <Route path="team/:id" element={<TeamMemberDetail />} />
        <Route path="security" element={<SecurityLogs />} />
        <Route path="reports" element={<Reports />} />
        <Route path="my-backup" element={<ClientBackup />} />
        <Route path="plans" element={<HubPlans />} />
        <Route path="notifications" element={<HubNotifications />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="hubchat" element={<HubChat />} />
        <Route path="logistica" element={<LogisticaHub />} />
        <Route path="automacoes" element={<Workflows />} />
        <Route path="integracoes" element={<Integrations />} />
        <Route path="destinos" element={<Destinos />} />
        <Route path="profile" element={<AccountSettings />} />


      </Route>

      <Route path="/dashboard" element={<Navigate to="/master" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
