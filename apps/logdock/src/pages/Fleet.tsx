import { Truck, Search, Plus, Filter, MoreHorizontal, AlertTriangle, CheckCircle2, Clock, RefreshCw, X } from 'lucide-react';
import Button from '@shared/components/Button';
import { supabase } from '@shared/lib/supabase';
import { useAuth } from '@shared/context/AuthContext';
import { toast } from 'react-hot-toast';
import LogtaModal from '@shared/components/Modal';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  mileage: number;
  status: 'operational' | 'maintenance' | 'critical';
  health: number;
  lastMaintenance: string;
}

const mockVehicles: Vehicle[] = [
  { id: '1', plate: 'ABC-1234', model: 'Scania R450', brand: 'Scania', year: 2022, mileage: 125000, status: 'operational', health: 95, lastMaintenance: '2024-03-15' },
  { id: '2', plate: 'XYZ-5678', model: 'Volvo FH540', brand: 'Volvo', year: 2021, mileage: 210000, status: 'maintenance', health: 70, lastMaintenance: '2024-04-20' },
  { id: '3', plate: 'KJH-9012', model: 'Mercedes-Benz Actros', brand: 'Mercedes', year: 2023, mileage: 45000, status: 'operational', health: 98, lastMaintenance: '2024-02-10' },
  { id: '4', plate: 'LMN-3456', model: 'Scania G410', brand: 'Scania', year: 2020, mileage: 340000, status: 'critical', health: 45, lastMaintenance: '2023-11-05' },
];

const FleetPage: React.FC = () => {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    model: '',
    brand: '',
    year: new Date().getFullYear(),
    type: 'truck',
    mileage: 0
  });

  const handleSave = async () => {
    if (!profile?.company_id) return;
    if (!newVehicle.plate || !newVehicle.model) {
      toast.error('Preencha os campos obrigatórios (Placa e Modelo)');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('vehicles').insert({
        ...newVehicle,
        company_id: profile.company_id,
        health_score: 100,
        status: 'operational'
      });

      if (error) throw error;

      toast.success('Veículo cadastrado com sucesso!');
      setIsModalOpen(false);
      setNewVehicle({ plate: '', model: '', brand: '', year: new Date().getFullYear(), type: 'truck', mileage: 0 });
      fetchVehicles();
    } catch (err) {
      console.error('Erro ao salvar veículo:', err);
      toast.error('Erro ao salvar no banco. Verifique se as tabelas foram criadas.');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchVehicles = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Tabela vehicles ainda não existe. Usando dados mockados.', error);
        setVehicles(mockVehicles);
      } else if (data && data.length > 0) {
        setVehicles(data);
      } else {
        setVehicles(mockVehicles); // Fallback para demonstração
      }
    } catch (err) {
      setVehicles(mockVehicles);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchVehicles();
  }, [profile]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Gestão de Frota</h2>
          <p style={styles.subtitle}>Gerencie e monitore a saúde de seus veículos em tempo real.</p>
        </div>
        <div style={styles.actions}>
          <Button variant="outline" icon={<Filter size={18} />}>Filtrar</Button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>Novo Veículo</Button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total de Veículos</span>
          <span style={styles.statValue}>{mockVehicles.length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Em Operação</span>
          <span style={{ ...styles.statValue, color: '#10B981' }}>{mockVehicles.filter(v => v.status === 'operational').length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Em Manutenção</span>
          <span style={{ ...styles.statValue, color: '#F59E0B' }}>{mockVehicles.filter(v => v.status === 'maintenance').length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Risco Crítico</span>
          <span style={{ ...styles.statValue, color: '#EF4444' }}>{mockVehicles.filter(v => v.status === 'critical').length}</span>
        </div>
      </div>

      <div style={styles.searchBar}>
        <Search size={20} color="#94A3B8" />
        <input 
          type="text" 
          placeholder="Buscar por placa, modelo ou marca..." 
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw className="animate-spin" size={32} color="#0061FF" />
            <span>Carregando frota...</span>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Veículo</th>
                <th style={styles.th}>Placa</th>
                <th style={styles.th}>Quilometragem</th>
                <th style={styles.th}>Saúde</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Última Manut.</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.filter(v => 
                v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.model.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(vehicle => (
                <tr key={vehicle.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.vehicleInfo}>
                      <div style={styles.iconBox}>
                        <Truck size={20} color="#0061FF" />
                      </div>
                      <div>
                        <div style={styles.vehicleModel}>{vehicle.model}</div>
                        <div style={styles.vehicleBrand}>{vehicle.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}><span style={styles.plate}>{vehicle.plate}</span></td>
                  <td style={styles.td}>
                    <div style={styles.mileageBox}>
                      <span style={styles.mileageVal}>{vehicle.mileage.toLocaleString()}</span>
                      <span style={styles.mileageUnit}>km</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.scoreIndicator}>
                      <div style={{ ...styles.scoreCircle, borderColor: (vehicle.health || vehicle.health_score) > 80 ? '#10B981' : '#EF4444' }}>
                        {vehicle.health || vehicle.health_score}%
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ 
                      ...styles.statusBadge,
                      backgroundColor: vehicle.status === 'operational' ? '#E1FCEF' : vehicle.status === 'maintenance' ? '#FEF3C7' : '#FEE2E2',
                      color: vehicle.status === 'operational' ? '#065F46' : vehicle.status === 'maintenance' ? '#92400E' : '#991B1B'
                    }}>
                      {vehicle.status === 'operational' && <CheckCircle2 size={14} />}
                      {vehicle.status === 'maintenance' && <Clock size={14} />}
                      {vehicle.status === 'critical' && <AlertTriangle size={14} />}
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </div>
                  </td>
                  <td style={styles.td}>{vehicle.lastMaintenance ? new Date(vehicle.lastMaintenance).toLocaleDateString('pt-BR') : vehicle.last_maintenance_date ? new Date(vehicle.last_maintenance_date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                  <td style={styles.td}>
                    <button style={styles.moreBtn}><MoreHorizontal size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <LogtaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Veículo">
        <div style={styles.modalContent}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Placa *</label>
              <input 
                style={styles.input} 
                placeholder="ABC-1234" 
                value={newVehicle.plate}
                onChange={e => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Modelo *</label>
              <input 
                style={styles.input} 
                placeholder="Ex: Scania R450" 
                value={newVehicle.model}
                onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Marca</label>
              <input 
                style={styles.input} 
                placeholder="Ex: Scania" 
                value={newVehicle.brand}
                onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Ano</label>
              <input 
                style={styles.input} 
                type="number" 
                value={newVehicle.year}
                onChange={e => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Quilometragem Inicial</label>
              <input 
                style={styles.input} 
                type="number" 
                value={newVehicle.mileage}
                onChange={e => setNewVehicle({...newVehicle, mileage: parseInt(e.target.value)})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tipo</label>
              <select 
                style={styles.select}
                value={newVehicle.type}
                onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
              >
                <option value="truck">Caminhão</option>
                <option value="van">Van</option>
                <option value="car">Carro / Utilitário</option>
              </select>
            </div>
          </div>
          <div style={styles.modalFooter}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} loading={isSaving}>Salvar Veículo</Button>
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
  vehicleInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  iconBox: { width: '40px', height: '40px', backgroundColor: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  vehicleModel: { fontSize: '15px', fontWeight: '800', color: '#1E1E1E' },
  vehicleBrand: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  plate: { padding: '6px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px', fontSize: '13px', fontWeight: '900', color: '#1E293B', border: '1px solid #E2E8F0', letterSpacing: '0.5px' },
  mileageBox: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  mileageVal: { fontSize: '15px', fontWeight: '800', color: '#1E1E1E' },
  mileageUnit: { fontSize: '11px', fontWeight: '700', color: '#94A3B8' },
  scoreIndicator: { display: 'flex', alignItems: 'center' },
  scoreCircle: { width: '42px', height: '42px', borderRadius: '50%', border: '3px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', color: '#1E1E1E' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: '900', width: 'fit-content', textTransform: 'uppercase', letterSpacing: '0.5px' },
  moreBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '16px', color: '#64748B', fontWeight: '600' },
  modalContent: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '600', outline: 'none', transition: 'border 0.2s' },
  select: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '600', outline: 'none', backgroundColor: '#FFF' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }
};

export default FleetPage;
