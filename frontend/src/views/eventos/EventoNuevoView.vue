<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const loading = ref(false);

const form = ref({
    nombre: '',
    gestion: '2025',
    version: '',
    ubicacion: '',
    direccion: '',
    descripcion: '',
    estado: 1
});

const handleCreate = async () => {
    if (!form.value.nombre) {
        Swal.fire('Atención', 'El nombre del evento es obligatorio', 'warning');
        return;
    }

    try {
        loading.value = true;
        await api.post('/eventos', form.value);
        Swal.fire('Éxito', 'Gestión académica registrada', 'success');
        router.push('/coordinador/eventos');
    } catch (error) {
        Swal.fire('Error', 'No se pudo crear el evento', 'error');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
        <h2 class="text-2xl md:text-3xl font-black text-primary-dark dark:text-white uppercase italic">Nuevo Evento</h2>
        <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Registrar una nueva gestión académica en el sistema</p>
    </div>

    <div class="max-w-4xl bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-10 border border-slate-100 dark:border-gray-800 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Columna Izquierda -->
            <div class="space-y-6">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nombre Oficial del Evento</label>
                    <input v-model="form.nombre" type="text" placeholder="Ej: Congreso TWAS-TYAN" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Gestión / Año</label>
                        <input v-model="form.gestion" type="text" placeholder="2025" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Slogan o Versión</label>
                        <input v-model="form.version" type="text" placeholder="Ej: 3ra Edición" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                    </div>
                </div>
            </div>

            <!-- Columna Derecha -->
            <div class="space-y-6">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Ubicación (Ciudad / Sede)</label>
                    <input v-model="form.ubicacion" type="text" placeholder="La Paz, Bolivia" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Dirección Específica</label>
                    <input v-model="form.direccion" type="text" placeholder="Campus Universitario" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                </div>
            </div>

            <!-- Ancho completo -->
            <div class="md:col-span-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Resumen o Descripción General</label>
                <textarea v-model="form.descripcion" rows="4" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all resize-none"></textarea>
            </div>
        </div>

        <!-- Botones -->
        <div class="flex flex-col md:flex-row justify-end items-center gap-4 mt-10 pt-6 border-t border-slate-100 dark:border-gray-800">
            <button @click="router.back()" class="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Candelar y Volver</button>
            <button @click="handleCreate" :disabled="loading" class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black px-12 py-3.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all">
                {{ loading ? 'Procesando...' : 'Registrar Evento' }}
            </button>
        </div>
    </div>
</template>
