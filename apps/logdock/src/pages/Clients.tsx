import React, { useState, useEffect } from 'react';
import { Users, Building2, Mail, Phone, MapPin, Search, Plus, ExternalLink, MoreHorizontal } from 'lucide-react';
import { supabase } from '@shared/lib/supabase';
import { toast } from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const mockClients: Client[] = [
        { id: '1', name: 'Zaptro Logística LTDA', document: '12.345.678/0001-99', email: 'contato@zaptro.com', phone: '(11) 99999-0000', address: 'Av. Paulista, 1000 - SP', status: 'ATIVO' },
        { id: '2', name: 'Transportes TransRapido', document: '98.765.432/0001-00', email: 'adm@transrapido.com.br', phone: '(21) 88888-1111', address: 'Rua das Flores, 50 - RJ', status: 'ATIVO' },
        { id: '3', name: 'Logta Soluções', document: '11.222.333/0001-44', email: 'suporte@logta.me', phone: '(41) 77777-2222', address: 'Rua da Tecnologia, 200 - PR', status: 'INATIVO' },
      ];
      setClients(mockClients);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Base de Clientes</h2>
          <p style={styles.subtitle}>Gerencie os contextos operacionais de cada contratante.</p>
        </div>
        <button style={styles.addBtn} onClick={() => toast.success('Módulo de novo cliente em breve')}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div style={styles.searchBar}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <input type="text" placeholder="Filtrar por nome, CNPJ ou e-mail..." style={styles.searchInput} />
        </div>
      </div>

      <div style={styles.clientList}>
        {clients.map(client => (
          <div key={client.id} style={styles.clientCard}>
            <div style={styles.cardMain}>
              <div style={styles.clientAvatar}>
                <Building2 size={24} color="#0061FF" />
              </div>
              <div style={styles.clientInfo}>
                <div style={styles.nameRow}>
                  <h3 style={styles.clientName}>{client.name}</h3>
                  <span style={{ ...styles.statusBadge, backgroundColor: client.status === 'ATIVO' ? '#DCFCE7' : '#F1F5F9', color: client.status === 'ATIVO' ? '#166534' : '#64748B' }}>
                    {client.status}
                  </span>
                </div>
                <div style={styles.docText}>{client.document}</div>
              </div>
              <button style={styles.moreBtn}><MoreHorizontal size={20} color="#94A3B8" /></button>
            </div>

            <div style={styles.cardDetails}>
              <div style={styles.detailItem}>
                <Mail size={14} color="#94A3B8" />
                <span>{client.email}</span>
              </div>
              <div style={styles.detailItem}>
                <Phone size={14} color="#94A3B8" />
                <span>{client.phone}</span>
              </div>
              <div style={styles.detailItem}>
                <MapPin size={14} color="#94A3B8" />
                <span style={styles.addressText}>{client.address}</span>
              </div>
            </div>

            <div style={styles.cardActions}>
              <button style={styles.contextBtn} onClick={() => toast.success('Abrindo Drive do Cliente...')}>
                <ExternalLink size={14} /> Ver Drive do Cliente
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { fontSize: '15px', color: '#64748B', fontWeight: '600', marginTop: '6px' },
  addBtn: { backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '16px', padding: '14px 28px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(0,97,255,0.2)' },
  searchBar: { display: 'flex', gap: '20px' },
  searchBox: { flex: 1, backgroundColor: '#FFF', borderRadius: '20px', border: '1px solid #F1F5F9', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' },
  searchInput: { border: 'none', background: 'none', outline: 'none', padding: '16px 0', fontSize: '15px', fontWeight: '600', width: '100%', color: '#1E1E1E' },
  clientList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '32px' },
  clientCard: { backgroundColor: '#FFF', borderRadius: '32px', padding: '32px', border: '1px solid #F1F5F9', transition: 'all 0.3s ease', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' },
  cardMain: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' },
  clientAvatar: { width: '64px', height: '64px', backgroundColor: '#F0F7FF', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,97,255,0.1)' },
  clientInfo: { flex: 1 },
  nameRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' },
  clientName: { fontSize: '18px', fontWeight: '900', color: '#1E1E1E', margin: 0, letterSpacing: '-0.3px' },
  statusBadge: { fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  docText: { fontSize: '12px', color: '#94A3B8', fontWeight: '700', letterSpacing: '0.2px' },
  moreBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '10px', transition: 'all 0.2s' },
  cardDetails: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', padding: '24px', backgroundColor: '#F8FAFC', borderRadius: '24px' },
  detailItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '700', color: '#475569' },
  addressText: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardActions: { display: 'flex' },
  contextBtn: { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #0061FF22', backgroundColor: '#F0F7FF', color: '#0061FF', fontSize: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' },
};

export default ClientsPage;
