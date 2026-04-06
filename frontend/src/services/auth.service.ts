import api from './api';
import type { Usuario } from '@/types';

export const authService = {
  login(credentials: { email: string; password: string }) {
    return api.post<{ token: string; user: Usuario }>('/auth/login', credentials);
  },
  
  register(userData: Partial<Usuario> & { profile: any }) {
    return api.post('/auth/register', userData);
  },
  
  logout() {
    // Si el backend requiere invalidar token
    // return api.post('/auth/logout');
    localStorage.removeItem('token');
  },
  
  getCurrentUser() {
    return api.get<Usuario>('/auth/me');
  }
};
