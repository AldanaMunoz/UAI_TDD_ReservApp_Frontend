import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Crear instancia de axios con el token
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token automáticamente
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

export interface MenuItem {
  id: number;
  name: string;
  imageUrl?: string;
}

export interface MenuDelDia {
  planificacion_id: number;
  fecha: string;
  menu_id: number;
  entrada_id?: number;
  entrada_nombre?: string;
  entrada_imagen?: string;
  principal_id?: number;
  principal_nombre?: string;
  principal_imagen?: string;
  alternativo_id?: number;
  alternativo_nombre?: string;
  alternativo_imagen?: string;
  vegetariana_id?: number;
  vegetariana_nombre?: string;
  vegetariana_imagen?: string;
}

export interface Reserva {
  id: number;
  fecha_reservada?: string;
  id_comida_entrada?: number;
  id_comida_principal?: number;
  id_comida_postre?: number;
  id_comida_bebida?: number;
  estado_reserva?: string;
  codigo_qr?: string;
  entrada_nombre?: string;
  principal_nombre?: string;
  postre_nombre?: string;
  bebida_nombre?: string;
}

export interface CreateReservationData {
  fecha_reservada: string;
  id_comida_entrada?: number;
  id_comida_principal?: number;
  id_comida_postre?: number;
  id_comida_bebida?: number;
  userId: number;
}

export const menuService = {
  async getMenuByDate(fecha: string): Promise<{ fecha: string; menu: MenuDelDia }> {
    const response = await api.get(`/menu/${fecha}`);
    return response.data;
  },

  async getMyReservation(fecha: string, userId: number): Promise<{ hasReservation: boolean; reserva?: Reserva }> {
    const response = await api.get(`/menu/reservas/mi-reserva/${fecha}`, {
      params: { userId }
    });
    return response.data;
  },

  async createReservation(data: CreateReservationData): Promise<{ message: string; reservaId: number }> {
    const response = await api.post('/menu/reservas', data);
    return response.data;
  },

  async cancelReservation(reservaId: number, userId: number): Promise<{ message: string }> {
    const response = await api.delete(`/menu/reservas/${reservaId}`, {
      data: { userId }
    });
    return response.data;
  },

  async getBebidas(): Promise<MenuItem[]> {
    const response = await api.get('/foods/tipo/Bebida');
    return response.data;
  },

  async getPostres(): Promise<MenuItem[]> {
    const response = await api.get('/foods/tipo/Postre');
    return response.data;
  },

  async getMyReservations(userId: number): Promise<Reserva[]> {
    const response = await api.get(`/menu/reservas/usuario/${userId}`);
    return response.data;
  }
};

export default menuService;
