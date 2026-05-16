<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const eventos = ref<any[]>([]);

const fetchEventos = async () => {
  try {
    const res = await api.get('/eventos');
    eventos.value = res.data?.data || res.data || [];
    
    if (eventos.value.length === 0) {
        await Swal.fire('Sin Eventos', 'No hay eventos registrados. Crea uno primero.', 'warning');
        router.push({ name: 'admin-eventos' });
        return;
    }

    const eventOptions = eventos.value.reduce((acc, ev) => {
      acc[ev.id] = ev.nombre;
      return acc;
    }, {} as Record<number, string>);

    const { value: eventId } = await Swal.fire({
      title: '<span class="text-red-600 font-black italic">GESTIÓN DE ACTIVIDADES</span>',
      text: 'Selecciona el evento para gestionar sus actividades:',
      input: 'select',
      inputOptions: eventOptions,
      inputPlaceholder: 'Seleccionar evento...',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Regresar',
      allowOutsideClick: false,
      inputValidator: (value) => {
        if (!value) return '¡Debes seleccionar un evento!'
      }
    });

    if (eventId) {
      router.push({ 
        name: 'admin-gestion-eventos',
        query: { 
          eventoId: eventId,
          newAct: 'true' 
        }
      });
    } else {
      router.push({ name: 'admin-dashboard' });
    }
  } catch (e) {
    console.error('Error in AdminActividadesView:', e);
    router.push({ name: 'admin-dashboard' });
  }
};

onMounted(fetchEventos);
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <div class="text-center space-y-4">
      <div class="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-slate-500 font-black uppercase tracking-widest text-xs">Cargando selección de evento...</p>
    </div>
  </div>
</template>
