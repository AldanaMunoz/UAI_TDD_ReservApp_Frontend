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

export interface WeeklyPlanning {
  id?: number;
  seasonId: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
}

export interface WeeklyPlanningMeal {
  id?: number;
  weeklyPlanningId: number;
  mealId: number;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export interface WeeklyPlanningWithMeals {
  planning: WeeklyPlanning;
  meals: WeeklyPlanningMeal[];
}

export interface GeneratePlanningsResult {
  message: string;
  count: number;
  plannings: WeeklyPlanning[];
}

export interface MealAssignment {
  dayOfWeek: number;
  mealId: number;
}

export interface DayMealAssignments {
  entradaId: number | null;
  principalId: number | null;
  alternativoId: number | null;
  vegetarianoId: number | null;
}

const weeklyPlanningService = {
  async getAll(): Promise<WeeklyPlanning[]> {
    const response = await api.get('/weekly-plannings');
    return response.data;
  },

  async getById(id: number): Promise<WeeklyPlanning> {
    const response = await api.get(`/weekly-plannings/${id}`);
    return response.data;
  },

  async getBySeason(seasonId: number): Promise<WeeklyPlanning[]> {
    const response = await api.get(`/weekly-plannings/by-season/${seasonId}`);
    return response.data;
  },

  async getWithMeals(id: number): Promise<WeeklyPlanningWithMeals> {
    const response = await api.get(`/weekly-plannings/${id}/with-meals`);
    return response.data;
  },

  async create(planning: WeeklyPlanning): Promise<WeeklyPlanning> {
    const response = await api.post('/weekly-plannings', planning);
    return response.data;
  },

  async update(id: number, data: Partial<WeeklyPlanning>): Promise<{ message: string; planning: WeeklyPlanning }> {
    const response = await api.patch(`/weekly-plannings/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/weekly-plannings/hard/${id}`);
    return response.data;
  },

  async generateForSeason(seasonId: number): Promise<GeneratePlanningsResult> {
    const response = await api.post('/weekly-plannings/generate', { seasonId });
    return response.data;
  },

  async assignMeal(weeklyPlanningId: number, dayOfWeek: number, mealId: number): Promise<{ message: string; assignment: WeeklyPlanningMeal }> {
    const response = await api.post(`/weekly-plannings/${weeklyPlanningId}/meals`, { dayOfWeek, mealId });
    return response.data;
  },

  async bulkAssignMeals(weeklyPlanningId: number, meals: MealAssignment[]): Promise<{ message: string; count: number; assignments: WeeklyPlanningMeal[] }> {
    const response = await api.post(`/weekly-plannings/${weeklyPlanningId}/meals/bulk`, { meals });
    return response.data;
  },

  async removeMeal(weeklyPlanningId: number, dayOfWeek: number): Promise<{ message: string }> {
    const response = await api.delete(`/weekly-plannings/${weeklyPlanningId}/meals/${dayOfWeek}`);
    return response.data;
  },

  async saveMealAssignments(
    seasonId: number,
    weekNumber: number,
    mealAssignments: Record<number, DayMealAssignments>
  ): Promise<{ message: string }> {
    const response = await api.post('/weekly-plannings/meal-assignments', {
      seasonId,
      weekNumber,
      mealAssignments
    });
    return response.data;
  },

  async getMealAssignments(seasonId: number, weekNumber: number): Promise<Record<number, DayMealAssignments>> {
    const response = await api.get(`/weekly-plannings/meal-assignments/${seasonId}/${weekNumber}`);
    return response.data;
  }
};

export default weeklyPlanningService;
