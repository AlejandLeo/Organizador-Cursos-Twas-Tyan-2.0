import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Usuario } from '@/types';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Usuario | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isAuthenticated = computed(() => !!token.value);

  async function login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password });
      token.value = response.data.token;
      
      if (token.value) {
        localStorage.setItem('token', token.value);
      }
      
      // Request updated fresh profile from /auth/me after securely writing token to local storage 
      // preventing old cached default users
      const meResponse = await api.get('/auth/me');
      user.value = meResponse.data;
      
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }

  async function fetchUser() {
    try {
      if (token.value) {
        // Using /auth/me to populate the real user profile
        const response = await api.get('/auth/me');
        if (response.data) {
           user.value = response.data;
        }
      }
    } catch (e: any) {
      console.error('Error fetching user', e);
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    fetchUser
  };
});
