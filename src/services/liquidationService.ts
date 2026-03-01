import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface Liquidation {
  id?: number;
  month: number;
  year: number;
  totalAmount?: number;
}

export interface GenerateLiquidationResult {
  message: string;
  liquidation: Liquidation;
  reservationsCount: number;
  reservationsUpdated: number;
  totalAmount: number;
}

export interface ReservationDetail {
  reservationId: number;
  reservedDate: string;
  status: string;
  employeeName: string;
  employeeLastName: string;
  employeeType: 'interno' | 'externo';
  basePrice: number;
  appliedPrice: number;
}

export interface LiquidationDetails {
  liquidation: Liquidation;
  reservations: ReservationDetail[];
}

const liquidationService = {
  async getAll(): Promise<Liquidation[]> {
    const response = await api.get('/liquidations');
    return response.data;
  },

  async getById(id: number): Promise<Liquidation> {
    const response = await api.get(`/liquidations/${id}`);
    return response.data;
  },

  async generate(month: number, year: number): Promise<GenerateLiquidationResult> {
    const response = await api.post('/liquidations/generate', { month, year });
    return response.data;
  },

  async create(liquidation: Liquidation): Promise<Liquidation> {
    const response = await api.post('/liquidations', liquidation);
    return response.data;
  },

  async update(id: number, data: Partial<Liquidation>): Promise<{ message: string; liquidation: Liquidation }> {
    const response = await api.patch(`/liquidations/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/liquidations/hard/${id}`);
    return response.data;
  },

  async getDetails(id: number): Promise<LiquidationDetails> {
    const response = await api.get(`/liquidations/${id}/details`);
    return response.data;
  },

  getExportCSVUrl(id: number): string {
    const token = localStorage.getItem('token');
    return `${API_URL}/liquidations/${id}/export/csv?token=${token}`;
  }
};

export default liquidationService;
