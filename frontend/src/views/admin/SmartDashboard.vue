<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import AdminDashboardView from './AdminDashboardView.vue';
import CoordinadorView from '@/views/dashboard/CoordinadorView.vue';

const authStore = useAuthStore();
</script>

<template>
  <!-- Si es Super Usuario (admin@tyan.org), ve el Dashboard Global Rojo -->
  <AdminDashboardView v-if="authStore.esSuperUsuario" />
  
  <!-- Si es Coordinador, recupera su vista original de Centro de Mando Azul -->
  <CoordinadorView v-else />
</template>
