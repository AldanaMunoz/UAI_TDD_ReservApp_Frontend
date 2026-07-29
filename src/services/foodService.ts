import api from './api';

export interface Food {
  id?: number;
  foodTypeId?: number;
  name: string;
  description?: string;
  type?: string;
  isSpecial?: boolean;
  imageUrl?: string | null;
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
  },

  async uploadImage(id: number, image: File): Promise<{ message: string; food: Food }> {
    const formData = new FormData();
    formData.append('image', image);
    const response = await api.patch(`/foods/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteImage(id: number): Promise<{ message: string; food: Food }> {
    const response = await api.delete(`/foods/${id}/image`);
    return response.data;
  }
};

export default foodService;
