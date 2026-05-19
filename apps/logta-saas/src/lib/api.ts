// Mock API client for Logta SaaS
// This will be replaced by real API calls later

export const api = {
  getDashboardStats: async () => {
    return {
      revenue: "R$ 142.500,00",
      deliveries: 48,
      fleetStatus: "92%",
      alerts: 3
    };
  },
  
  getClients: async () => {
    return [
      { id: 1, name: 'Transportes Transville', status: 'Ativo' },
      { id: 2, name: 'Indústria Metalúrgica SA', status: 'Em Negociação' },
    ];
  }
};
