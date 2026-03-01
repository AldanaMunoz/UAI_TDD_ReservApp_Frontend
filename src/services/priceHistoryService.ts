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

export interface PriceHistory {
  id?: number;
  price: number;
  startDate: string; // YYYY-MM-DD
  toDate?: string | null; // YYYY-MM-DD
}

export interface PriceHistoryByDatesResponse {
  month: number;
  year: number;
  rangeStart: string;
  rangeEnd: string;
  data: PriceHistory[];
}

const priceHistoryService = {
  async getAll(): Promise<PriceHistory[]> {
    const response = await api.get('/price-history');
    return response.data;
  },

  async getById(id: number): Promise<PriceHistory> {
    const response = await api.get(`/price-history/${id}`);
    return response.data;
  },

  async getByDates(month: number, year: number): Promise<PriceHistoryByDatesResponse> {
    const response = await api.get(`/price-history/by-dates`, {
      params: { month, year }
    });
    return response.data;
  },

  async create(priceHistory: Omit<PriceHistory, 'id'>): Promise<PriceHistory> {
    const response = await api.post('/price-history', priceHistory);
    return response.data;
  },

  async update(id: number, data: Partial<Omit<PriceHistory, 'id'>>): Promise<{ message: string; priceHistory: PriceHistory }> {
    const response = await api.patch(`/price-history/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/price-history/hard/${id}`);
    return response.data;
  }
};

export default priceHistoryService;
