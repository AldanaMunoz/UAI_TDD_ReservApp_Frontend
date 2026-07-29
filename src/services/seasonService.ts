import api from './api';

export interface Season {
  id?: number;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
}

const seasonService = {
  async getAll(): Promise<Season[]> {
    const response = await api.get('/seasons');
    return response.data;
  },

  async getById(id: number): Promise<Season> {
    const response = await api.get(`/seasons/${id}`);
    return response.data;
  },

  async create(season: Season): Promise<Season> {
    const response = await api.post('/seasons', season);
    return response.data;
  },

  async update(id: number, data: Partial<Season>): Promise<{ message: string; season: Season }> {
    const response = await api.patch(`/seasons/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/seasons/hard/${id}`);
    return response.data;
  }
};

export default seasonService;
