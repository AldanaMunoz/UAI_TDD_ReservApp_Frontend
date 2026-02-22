import axios, { type AxiosInstance } from 'axios';

const API_URL = 'http://localhost:3000/api';

export interface User {
  id: number;
  email: string;
  activo: number;
  firebaseUID: string;
  nombre?: string;
  apellido?: string;
  turno?: 'manana' | 'tarde' | 'noche';
  tipo?: 'interno' | 'externo';
  roles?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  turno: 'manana' | 'tarde' | 'noche';
  tipo: 'interno' | 'externo';
}

export interface LoginResponse {
  token: string;
  user: User;
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Interceptor - Token:', token ? `${token.substring(0, 20)}...` : 'No hay token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en la respuesta:', error);
    if (error.response?.status === 401) {
      console.error('Error 401: No autorizado. Token inválido o expirado.');
      // Si el token es inválido, limpiamos el localStorage
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(userData: RegisterData): Promise<{ message: string; userId: number }> {
    // Transformar al formato que espera el backend
    const payload = {
      user: {
        email: userData.email,
        password: userData.password,
        activo: 1
      },
      person: {
        nombre: userData.nombre,
        apellido: userData.apellido
      },
      employee: {
        turno: userData.turno,
        tipo: userData.tipo
      }
    };
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials);
    // El backend devuelve firebase.idToken en lugar de token
    if (response.data.firebase?.idToken) {
      localStorage.setItem('token', response.data.firebase.idToken);
      localStorage.setItem('refreshToken', response.data.firebase.refreshToken);
      localStorage.setItem('firebaseUID', response.data.firebase.localId);

      // Normalizar roles: aplanar arrays anidados y mapear IDs a nombres
      let roles = response.data.user.roles || ['Empleado'];

      console.log('Roles recibidos del backend:', roles);

      // Si roles es un array anidado como [["1"]], aplanarlo recursivamente
      while (Array.isArray(roles) && roles.length > 0 && Array.isArray(roles[0])) {
        roles = roles.flat();
      }

      console.log('Roles después de aplanar:', roles);

      // Mapear IDs de roles a nombres (manejar números y strings)
      const roleMap: { [key: string]: string } = {
        '1': 'Administrador',
        '2': 'Empleado',
        'Administrador': 'Administrador',
        'Empleado': 'Empleado'
      };

      roles = roles.map((role: any) => {
        const roleKey = String(role);
        return roleMap[roleKey] || roleKey;
      });

      console.log('Roles después de mapear:', roles);

      const userWithRole = {
        ...response.data.user,
        roles
      };

      localStorage.setItem('user', JSON.stringify(userWithRole));

      // Adaptar la respuesta al formato esperado por el frontend
      return {
        token: response.data.firebase.idToken,
        user: userWithRole
      };
    }

    // Fallback si no hay firebase en la respuesta
    return {
      token: response.data.firebase.idToken,
      user: response.data.user
    };
  },

  async verifyToken(): Promise<{ valid: boolean; user: User }> {
    const response = await api.get('/users/verify');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('firebaseUID');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export default api;