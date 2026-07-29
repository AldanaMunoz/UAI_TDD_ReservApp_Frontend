import api from './api';

export interface User {
  id: number;
  email: string;
  activo: number;
  firebaseUID: string;
  nombre?: string;
  apellido?: string;
  turno?: 'manana' | 'tarde' | 'noche';
  tipo?: 'interno' | 'externo';
  roles: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

function clearStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('firebaseUID');
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('user');
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials);
    const idToken = response.data.firebase?.idToken;
    if (!idToken || !response.data.user) {
      throw new Error('El servidor devolvió una sesión incompleta');
    }

    const user: User = {
      ...response.data.user,
      roles: Array.isArray(response.data.user.roles)
        ? response.data.user.roles
        : [],
    };

    localStorage.setItem('token', idToken);
    localStorage.setItem('refreshToken', response.data.firebase.refreshToken || '');
    localStorage.setItem('firebaseUID', response.data.firebase.localId || '');
    localStorage.setItem('sessionToken', response.data.sessionToken || '');
    localStorage.setItem('user', JSON.stringify(user));

    return { token: idToken, user };
  },

  async verifyToken(): Promise<User> {
    const response = await api.get('/auth/me');
    const user = response.data.user as User;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    const sessionToken = localStorage.getItem('sessionToken');
    const firebaseUID = localStorage.getItem('firebaseUID');

    try {
      if (sessionToken) {
        await api.post('/auth/logout', { sessionToken, firebaseUID });
      }
    } finally {
      clearStoredSession();
    }
  },

  clearSession: clearStoredSession,
};

export default authService;
