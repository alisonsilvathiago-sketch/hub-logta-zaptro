import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LOGSTOKA_ROW_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { DEMO_COLLABORATORS, type LogstokaCollaborator } from '@/lib/logstokaDemoTeam';
import { SETTINGS_BASE } from '@/modules/settings/settingsNav';
import Modal from '@/components/ui/Modal';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useTablePagination } from '@/hooks/useTablePagination';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: '',
  department: 'Expedição',
  status: 'Ativo' as LogstokaCollaborator['status'],
};

const SettingsTeamPanel: React.FC = () => {
  const [collaborators, setCollaborators] = useState(DEMO_COLLABORATORS);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState<'equipe' | 'permissoes'>('equipe');
  const { paginatedItems, footerProps } = useTablePagination(collaborators, 10, tab);

  const saveCollaborator = () => {
    if (!form.name || !form.email || !form.role) {
      toast.error('Nome, e-mail e cargo são obrigatórios');
      return;
    }
    const newCollab: LogstokaCollaborator = {
      id: String(Date.now()),
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      role: form.role,
      department: form.department,
      status: form.status,
      score: 75,
      movementsToday: 0,
      hiredAt: new Date().toISOString().slice(0, 10),
    };
    setCollaborators((prev) => [...prev, newCollab]);
    setModalOpen(false);
    setForm(emptyForm);
    toast.success('[Demo] Colaborador cadastrado');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">Equipe e Permissões</h2>
          <p className="mt-1 text-sm text-gray-500">Colaboradores WMS, papéis e ranking operacional.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ls-btn-secondary" onClick={() => setModalOpen(true)}>
            <UserPlus size={16} />
            Novo colaborador
          </button>
          <Link to={`${SETTINGS_BASE}/equipe/ranking`} className="ls-btn-primary">
            Ver ranking
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('equipe')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'equipe' ? 'bg-orange-600 text-white' : 'bg-gray-50 ring-1 ring-slate-200'}`}
        >
          Equipe
        </button>
        <button
          type="button"
          onClick={() => setTab('permissoes')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'permissoes' ? 'bg-orange-600 text-white' : 'bg-gray-50 ring-1 ring-slate-200'}`}
        >
          Permissões
        </button>
      </div>

      {tab === 'equipe' && (
        <>
          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Departamento</th>
                  <th className="ls-hide-mobile">Telefone</th>
                  <th>Status</th>
                  <th>Mov. hoje</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((c) => (
                  <ClickableTableRow key={c.id} to={`${SETTINGS_BASE}/equipe/${c.id}`}>
                    <td>
                      <p className={LOGSTOKA_ROW_TITLE_CLASS}>{c.name}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </td>
                    <td>{c.role}</td>
                    <td>{c.department}</td>
                    <td className="ls-hide-mobile">{c.phone || '—'}</td>
                    <td>
                      <span
                        className={`ls-badge ${
                          c.status === 'Ativo'
                            ? 'bg-orange-50 text-orange-700'
                            : c.status === 'Ausente'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="font-bold text-orange-700">{c.movementsToday}</td>
                    <td className="font-black">{c.score}</td>
                  </ClickableTableRow>
                ))}
              </tbody>
            </table>
          </div>
          <LogstokaTableFooter {...footerProps} hidden={collaborators.length === 0} itemLabel="colaboradores" />
        </>
      )}

      {tab === 'permissoes' && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Administrador Master', 'Acesso total ao LogStoka'],
            ['Gestor Logístico', 'Aprova movimentações, inventários e transferências'],
            ['Operador', 'Entrada, saída, conferência e inventário'],
          ].map(([role, desc]) => (
            <div key={role} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <p className="font-black">{role}</p>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title="Cadastro de colaborador"
        icon={<UserPlus size={20} strokeWidth={2.25} />}
        onClose={() => setModalOpen(false)}
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="ls-label">Nome completo</label>
            <input className="ls-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="ls-label">E-mail</label>
            <input className="ls-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="ls-label">Telefone</label>
            <input className="ls-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="ls-label">Cargo</label>
            <input className="ls-input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
          </div>
          <div>
            <label className="ls-label">Departamento</label>
            <select className="ls-input" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
              {['Operações WMS', 'Expedição', 'Inbound', 'Picking', 'Inventário', 'TI / Marketplaces'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ls-label">Status</label>
            <select className="ls-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LogstokaCollaborator['status'] }))}>
              <option value="Ativo">Ativo</option>
              <option value="Ausente">Ausente</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="ls-btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button type="button" className="ls-btn-primary" onClick={saveCollaborator}>
            <Plus size={16} />
            Salvar cadastro
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsTeamPanel;
