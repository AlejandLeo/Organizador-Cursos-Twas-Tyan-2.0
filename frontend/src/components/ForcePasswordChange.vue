<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usuariosService } from '@/services/usuarios.service';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const showOverlay = computed(() => authStore.isAuthenticated && authStore.user?.requiere_cambio_password);

const password = ref('');
const confirmPassword = ref('');
const isSubmitting = ref(false);

const handleUpdatePassword = async () => {
  if (password.value.length < 6) {
    return Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres.', 'error');
  }
  if (password.value !== confirmPassword.value) {
    return Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
  }

  try {
    isSubmitting.value = true;
    // Usamos el ID del usuario actual de la store
    const userId = authStore.user.id;
    
    // El servicio tiene changePassword que verifica la actual, 
    // pero aquí el Admin nos forzó el reset, así que necesitamos un endpoint
    // que use el ID pero no pida la actual si ya estamos logueados con el flag.
    // O podemos usar changePassword mandando la temporal que el admin nos dio.
    // Sin embargo, para simplificar, usaremos el endpoint de reset si el backend lo permite o creamos uno.
    
    // Como el usuario YA está logueado, podemos llamar a un nuevo método en el servicio.
    await usuariosService.update(userId, { password: password.value, requiere_cambio_password: false });
    
    authStore.user.requiere_cambio_password = false;
    Swal.fire('¡Éxito!', 'Tu contraseña ha sido actualizada. Ya puedes usar el sistema.', 'success');
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar la contraseña.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const handleLogout = () => {
  authStore.logout();
};
</script>

<template>
  <div v-if="showOverlay" class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4">
    <div class="bg-white dark:bg-[#0d0d14] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in duration-500">
      <div class="p-8 md:p-10 text-center">
        
        <!-- ICON -->
        <div class="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/10">
          <span class="material-symbols-outlined text-amber-600 text-4xl">lock_reset</span>
        </div>

        <h2 class="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight mb-2">Actualización Obligatoria</h2>
        <p class="text-slate-500 text-sm mb-8">Un administrador ha solicitado que cambies tu contraseña temporal por una nueva para garantizar la seguridad de tu cuenta.</p>

        <form @submit.prevent="handleUpdatePassword" class="space-y-4 text-left">
          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Nueva Contraseña</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">lock</span>
              <input v-model="password" type="password" required placeholder="Mínimo 6 caracteres"
                     class="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:border-amber-500/50 outline-none transition-all" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Confirmar Contraseña</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">verified_user</span>
              <input v-model="confirmPassword" type="password" required placeholder="Repite tu contraseña"
                     class="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:border-amber-500/50 outline-none transition-all" />
            </div>
          </div>

          <div class="pt-4 flex flex-col gap-3">
            <button type="submit" :disabled="isSubmitting"
                    class="w-full py-4 bg-amber-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all">
              {{ isSubmitting ? 'Actualizando...' : 'Establecer Nueva Contraseña' }}
            </button>
            <button @click="handleLogout" type="button"
                    class="w-full py-4 bg-transparent text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-all">
              Cerrar Sesión
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation-duration: 0.5s;
}
</style>
