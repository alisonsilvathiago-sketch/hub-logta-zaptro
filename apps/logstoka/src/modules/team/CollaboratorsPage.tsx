import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaStandardPageLayout, LOGSTOKA_ROW_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { DEMO_COLLABORATORS, type LogstokaCollaborator } from '@/lib/logstokaDemoTeam';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import Modal from '@/components/ui/Modal';
import ClickableTableRow from '@/components/ui/ClickableTableRow';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: '',
  department: 'Expedição',
  status: 'Ativo' as LogstokaCollaborator['status'],
};

const CollaboratorsPage: React.FC = () => {
  const [collaborators, setCollaborators] = useState(DEMO_COLLABORATORS);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const avgScore = Math.round(collaborators.reduce((a, c) => a + c.score, 0) / collaborators.length);

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
    <LogstokaStandardPageLayout
      title="Colaboradores"
      subtitle="Equipe WMS — separação, conferência, expedição e gestão"
      headerAction={
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ls-btn-secondary" onClick={() => setModalOpen(true)}>
            <UserPlus size={16} />
            Novo colaborador
          </button>
          <Link to={LOGSTOKA_ROUTES.RANKING} className="ls-btn-primary">
            Ver ranking
          </Link>
        </div>
      }
      kpis={[
        { label: 'Ativos', value: collaborators.filter((c) => c.status === 'Ativo').length },
        { label: 'Departamentos', value: new Set(collaborators.map((c) => c.department)).size },
        { label: 'Movimentações hoje', value: collaborators.reduce((a, c) => a + c.movementsToday, 0) },
        { label: 'Score médio', value: String(avgScore) },
      ]}
      mainContentTitle="Equipe"
    >
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
            {collaborators.map((c) => (
              <ClickableTableRow key={c.id} to={`/app/colaboradores/${c.id}`}>
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

      <Modal open={modalOpen} title="Cadastro de colaborador" onClose={() => setModalOpen(false)} wide>
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
                <option key={d} value={d}>
                  {d}
                </option>
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
          <button type="button" className="ls-btn-secondary" onClick={() => setModalOpen(false)}>
            Cancelar
          </button>
          <button type="button" className="ls-btn-primary" onClick={saveCollaborator}>
            <Plus size={16} />
            Salvar cadastro
          </button>
        </div>
      </Modal>
    </LogstokaStandardPageLayout>
  );
};

export default CollaboratorsPage;
