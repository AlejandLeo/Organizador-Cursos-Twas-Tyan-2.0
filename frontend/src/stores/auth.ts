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
      user.value = response.data.user;
      
      if (token.value) {
        localStorage.setItem('token', token.value);
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
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
    logout
  };
});
