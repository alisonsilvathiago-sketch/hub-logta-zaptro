import React, { useState } from 'react';
import { Settings2, Plus, Calendar, Clock, AlertTriangle, CheckCircle2, MoreHorizontal, Wrench, Fuel, RefreshCw } from 'lucide-react';
import Button from '@shared/components/Button';
import { supabase } from '@shared/lib/supabase';
import { useAuth } from '@shared/context/AuthContext';

interface MaintenanceTask {
  id: string;
  vehicle: string;
  type: 'Preventiva' | 'Corretiva' | 'Preditiva';
  description: string;
  date: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  cost?: number;
}

const mockTasks: MaintenanceTask[] = [
  { id: '1', vehicle: 'ABC-1234', type: 'Preventiva', description: 'Troca de Óleo e Filtros', date: '2024-05-10', status: 'scheduled' },
  { id: '2', vehicle: 'XYZ-5678', type: 'Corretiva', description: 'Reparo no Sistema de Freios', date: '2024-05-01', status: 'in_progress' },
  { id: '3', vehicle: 'KJH-9012', type: 'Preditiva', description: 'Análise de Desgaste de Pneus (IA)', date: '2024-04-25', status: 'completed', cost: 1250 },
];

const MaintenancePage: React.FC = () => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*, vehicles(plate)')
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.warn('Tabela maintenance_tasks ainda não existe. Usando dados mockados.');
        setTasks(mockTasks);
      } else if (data && data.length > 0) {
        setTasks(data.map((t: any) => ({
          ...t,
          vehicle: t.vehicles?.plate || 'Desconhecido',
          date: t.scheduled_date
        })));
      } else {
        setTasks(mockTasks);
      }
    } catch (err) {
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();
  }, [profile]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Centro de Manutenção</h2>
          <p style={styles.subtitle}>Acompanhe e agende manutenções para garantir a disponibilidade da frota.</p>
        </div>
        <div style={styles.actions}>
          <Button variant="outline" icon={<Calendar size={18} />}>Ver Agenda</Button>
          <Button variant="primary" icon={<Plus size={18} />}>Agendar Manutenção</Button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
             <Clock size={20} color="#0061FF" />
             <span style={styles.statLabel}>Agendadas</span>
          </div>
          <span style={styles.statValue}>12</span>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
             <Wrench size={20} color="#F59E0B" />
             <span style={styles.statLabel}>Em Oficina</span>
          </div>
          <span style={styles.statValue}>4</span>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
             <Fuel size={20} color="#10B981" />
             <span style={styles.statLabel}>Custo/Km (Médio)</span>
          </div>
          <span style={styles.statValue}>R$ 0,85</span>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
             <AlertTriangle size={20} color="#EF4444" />
             <span style={styles.statLabel}>Alertas IA</span>
          </div>
          <span style={styles.statValue}>3</span>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Próximas Tarefas</h3>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw className="animate-spin" size={32} color="#0061FF" />
            <span>Carregando manutenções...</span>
          </div>
        ) : (
          <div style={styles.taskList}>
            {tasks.map(task => (
              <div key={task.id} style={styles.taskCard}>
                <div style={styles.taskHeader}>
                  <div style={{ 
                    ...styles.typeBadge,
                    backgroundColor: task.type === 'Preditiva' ? '#EEF2FF' : task.type === 'Preventiva' ? '#E1FCEF' : '#FEE2E2',
                    color: task.type === 'Preditiva' ? '#4338CA' : task.type === 'Preventiva' ? '#065F46' : '#991B1B'
                  }}>
                    {task.type}
                  </div>
                  <button style={styles.moreBtn}><MoreHorizontal size={18} /></button>
                </div>
                <div style={styles.taskBody}>
                  <h4 style={styles.taskTitle}>{task.description}</h4>
                  <div style={styles.taskVehicle}>{task.vehicle}</div>
                </div>
                <div style={styles.taskFooter}>
                  <div style={styles.taskDate}>
                    <Calendar size={14} />
                    {new Date(task.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div style={{ 
                    ...styles.statusDot,
                    backgroundColor: task.status === 'completed' ? '#10B981' : task.status === 'in_progress' ? '#F59E0B' : '#CBD5E1'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
  statCard: { padding: '24px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '16px' },
  statHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  statLabel: { fontSize: '13px', color: '#64748B', fontWeight: '700' },
  statValue: { fontSize: '24px', fontWeight: '900', color: '#1E1E1E' },
  section: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '900', color: '#1E1E1E' },
  taskList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  taskCard: { padding: '24px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '20px' },
  taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
  taskBody: { display: 'flex', flexDirection: 'column', gap: '4px' },
  taskTitle: { fontSize: '16px', fontWeight: '800', color: '#1E1E1E', margin: 0 },
  taskVehicle: { fontSize: '13px', color: '#94A3B8', fontWeight: '600' },
  taskFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  taskDate: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B', fontWeight: '700' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  moreBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '16px', color: '#64748B', fontWeight: '600' }
};

export default MaintenancePage;
