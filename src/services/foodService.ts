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

export interface Food {
  id?: number;
  foodTypeId?: number;
  name: string;
  description?: string;
  type?: string;
  isSpecial?: boolean;
  imageUrl?: string;
  isActive?: boolean;
}

const foodService = {
  async getAll(): Promise<Food[]> {
    const response = await api.get('/foods');
    return response.data;
  },

  async getById(id: number): Promise<Food> {
    const response = await api.get(`/foods/${id}`);
    return response.data;
  },

  async create(food: Food): Promise<Food> {
    const response = await api.post('/foods', food);
    return response.data;
  },

  async update(id: number, data: Partial<Food>): Promise<{ message: string; food: Food }> {
    const response = await api.patch(`/foods/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/foods/hard/${id}`);
    return response.data;
  }
};

export default foodService;
