import { User, Search, Plus, Filter, MoreHorizontal, AlertTriangle, CheckCircle2, CreditCard, ShieldCheck, RefreshCw, X } from 'lucide-react';
import Button from '@shared/components/Button';
import { supabase } from '@shared/lib/supabase';
import { useAuth } from '@shared/context/AuthContext';
import { toast } from 'react-hot-toast';
import LogtaModal from '@shared/components/Modal';

interface Driver {
  id: string;
  name: string;
  cnh: string;
  cnhExpiration: string;
  vehicle: string;
  status: 'active' | 'blocked' | 'vacation';
  compliance: number;
}

const mockDrivers: Driver[] = [
  { id: '1', name: 'João Silva', cnh: '12345678900', cnhExpiration: '2026-05-15', vehicle: 'ABC-1234 (Scania R450)', status: 'active', compliance: 100 },
  { id: '2', name: 'Maria Santos', cnh: '98765432100', cnhExpiration: '2024-05-20', vehicle: 'XYZ-5678 (Volvo FH540)', status: 'blocked', compliance: 65 },
  { id: '3', name: 'Pedro Oliveira', cnh: '55566677788', cnhExpiration: '2025-10-10', vehicle: 'KJH-9012 (Mercedes-Benz Actros)', status: 'active', compliance: 90 },
  { id: '4', name: 'Ricardo Souza', cnh: '11122233344', cnhExpiration: '2024-06-05', vehicle: 'LMN-3456 (Scania G410)', status: 'vacation', compliance: 85 },
];

const DriversPage: React.FC = () => {
  const { profile } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [newDriver, setNewDriver] = useState({
    full_name: '',
    cpf: '',
    cnh_number: '',
    cnh_expiration: '',
  });

  const handleSave = async () => {
    if (!profile?.company_id) return;
    if (!newDriver.full_name || !newDriver.cnh_number || !newDriver.cnh_expiration) {
      toast.error('Preencha os campos obrigatórios (*)');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('drivers').insert({
        ...newDriver,
        company_id: profile.company_id,
        compliance_score: 100,
        status: 'active'
      });

      if (error) throw error;

      toast.success('Motorista cadastrado com sucesso!');
      setIsModalOpen(false);
      setNewDriver({ full_name: '', cpf: '', cnh_number: '', cnh_expiration: '' });
      fetchDrivers();
    } catch (err) {
      console.error('Erro ao salvar motorista:', err);
      toast.error('Erro ao salvar motorista. Verifique as tabelas.');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchDrivers = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('full_name', { ascending: true });

      if (error) {
        console.warn('Tabela drivers ainda não existe. Usando dados mockados.');
        setDrivers(mockDrivers);
      } else if (data && data.length > 0) {
        setDrivers(data);
      } else {
        setDrivers(mockDrivers);
      }
    } catch (err) {
      setDrivers(mockDrivers);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDrivers();
  }, [profile]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Controle de Motoristas</h2>
          <p style={styles.subtitle}>Gerencie cadastros, validades de CNH e vínculos com a frota.</p>
        </div>
        <div style={styles.actions}>
          <Button variant="outline" icon={<Filter size={18} />}>Filtrar</Button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>Novo Motorista</Button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total de Motoristas</span>
          <span style={styles.statValue}>{mockDrivers.length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Ativos</span>
          <span style={{ ...styles.statValue, color: '#10B981' }}>{mockDrivers.filter(d => d.status === 'active').length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Vencimento Próximo</span>
          <span style={{ ...styles.statValue, color: '#F59E0B' }}>1</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Bloqueados</span>
          <span style={{ ...styles.statValue, color: '#EF4444' }}>{mockDrivers.filter(d => d.status === 'blocked').length}</span>
        </div>
      </div>

      <div style={styles.searchBar}>
        <Search size={20} color="#94A3B8" />
        <input 
          type="text" 
          placeholder="Buscar por nome, CPF ou CNH..." 
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw className="animate-spin" size={32} color="#0061FF" />
            <span>Carregando motoristas...</span>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Motorista</th>
                <th style={styles.th}>CNH (Validade)</th>
                <th style={styles.th}>Veículo Vinculado</th>
                <th style={styles.th}>Conformidade</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {drivers.filter(d => 
                (d.name || d.full_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.cpf || '')?.includes(searchTerm)
              ).map(driver => (
                <tr key={driver.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.driverInfo}>
                      <div style={styles.avatarBox}>
                        {(driver.name || driver.full_name)?.charAt(0)}
                      </div>
                      <div>
                        <div style={styles.driverName}>{driver.name || driver.full_name}</div>
                        <div style={styles.driverId}>ID: {driver.id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.cnhInfo}>
                      <CreditCard size={14} color="#64748B" />
                      <span style={{ 
                        color: new Date(driver.cnhExpiration || driver.cnh_expiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? '#EF4444' : '#1E1E1E',
                        fontWeight: '700'
                      }}>
                        {new Date(driver.cnhExpiration || driver.cnh_expiration).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.vehiclePill}>
                      {driver.vehicle || 'Sem veículo'}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.scoreIndicator}>
                      <div style={{ ...styles.scoreCircle, borderColor: (driver.compliance || driver.compliance_score) > 80 ? '#10B981' : '#F59E0B' }}>
                        {driver.compliance || driver.compliance_score}%
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ 
                      ...styles.statusBadge,
                      backgroundColor: driver.status === 'active' ? '#E1FCEF' : driver.status === 'blocked' ? '#FEE2E2' : '#F1F5F9',
                      color: driver.status === 'active' ? '#065F46' : driver.status === 'blocked' ? '#991B1B' : '#475569'
                    }}>
                      {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.moreBtn}><MoreHorizontal size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <LogtaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Motorista">
        <div style={styles.modalContent}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nome Completo *</label>
              <input 
                style={styles.input} 
                placeholder="Ex: João da Silva" 
                value={newDriver.full_name}
                onChange={e => setNewDriver({...newDriver, full_name: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>CPF</label>
              <input 
                style={styles.input} 
                placeholder="000.000.000-00" 
                value={newDriver.cpf}
                onChange={e => setNewDriver({...newDriver, cpf: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nº da CNH *</label>
              <input 
                style={styles.input} 
                placeholder="00000000000" 
                value={newDriver.cnh_number}
                onChange={e => setNewDriver({...newDriver, cnh_number: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Validade da CNH *</label>
              <input 
                style={styles.input} 
                type="date" 
                value={newDriver.cnh_expiration}
                onChange={e => setNewDriver({...newDriver, cnh_expiration: e.target.value})}
              />
            </div>
          </div>
          <div style={styles.modalFooter}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} loading={isSaving}>Salvar Motorista</Button>
          </div>
        </div>
      </LogtaModal>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748B', marginTop: '4px' },
  actions: { display: 'flex', gap: '12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  statCard: { padding: '24px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '8px' },
  statLabel: { fontSize: '13px', color: '#64748B', fontWeight: '600' },
  statValue: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #F1F5F9' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: '15px', fontWeight: '600', color: '#1E1E1E', width: '100%' },
  tableContainer: { backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' as const },
  th: { padding: '20px 24px', fontSize: '12px', fontWeight: '800', color: '#64748B', borderBottom: '1px solid #F1F5F9', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' },
  td: { padding: '20px 24px' },
  driverInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatarBox: { width: '40px', height: '40px', backgroundColor: '#0061FF', color: '#FFF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900' },
  driverName: { fontSize: '15px', fontWeight: '800', color: '#1E1E1E' },
  driverId: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  cnhInfo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
  vehiclePill: { padding: '6px 14px', backgroundColor: '#F0F7FF', borderRadius: '10px', fontSize: '11px', fontWeight: '900', color: '#0061FF', border: '1px solid #E0F2FE', textTransform: 'uppercase', letterSpacing: '0.5px' },
  scoreIndicator: { display: 'flex', alignItems: 'center' },
  scoreCircle: { width: '42px', height: '42px', borderRadius: '50%', border: '3px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#1E1E1E' },
  statusBadge: { padding: '8px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: '900', width: 'fit-content', textTransform: 'uppercase', letterSpacing: '0.5px' },
  moreBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '16px', color: '#64748B', fontWeight: '600' },
  modalContent: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '600', outline: 'none', transition: 'border 0.2s' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }
};

export default DriversPage;
