<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();
const eventoId = Number(route.params.id);

const evento = ref<any>(null);
const isLoading = ref(true);
const form = ref<any>({});
const previewImg = ref<string | null>(null);

const fetchData = async () => {
    try {
        isLoading.value = true;
        const res = await api.get(`/eventos/${eventoId}`);
        evento.value = res.data;
        form.value = { 
            ...res.data, 
            imagen_fondo: null,
            cronograma: res.data.cronograma ? (typeof res.data.cronograma === 'string' ? JSON.parse(res.data.cronograma) : res.data.cronograma) : []
        };
        previewImg.value = res.data.imagen_fondo;
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo cargar el evento', 'error');
    } finally {
        isLoading.value = false;
    }
};

const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        form.value.imagen_fondo = file;
        previewImg.value = URL.createObjectURL(file);
    }
};

const eliminarEvento = async () => {
    const result = await Swal.fire({
        title: '¿Eliminar este Evento?',
        text: `Esta acción borrará permanentemente "${evento.value.nombre}" y todas sus actividades vinculadas.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, borrar definitivamente',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/eventos/${eventoId}`);
            Swal.fire('¡Eliminado!', 'El evento ha sido removido del sistema.', 'success');
            router.push('/coordinador/eventos');
        } catch (error) {
            Swal.fire('Error', 'No se pudo eliminar el evento.', 'error');
        }
    }
};

const guardarCambios = async () => {
    try {
        const formData = new FormData();
        Object.keys(form.value).forEach(key => {
            if (key === 'imagen_fondo') {
                if (form.value.imagen_fondo) formData.append('imagen_fondo', form.value.imagen_fondo);
            } else if (key === 'cronograma') {
                formData.append('cronograma', JSON.stringify(form.value.cronograma));
            } else {
                formData.append(key, form.value[key]);
            }
        });

        await api.put(`/eventos/${eventoId}`, formData);
        Swal.fire('¡Actualizado!', 'La configuración se ha guardado con éxito.', 'success');
        fetchData();
    } catch (err) {
        Swal.fire('Error', 'No se pudo actualizar el evento', 'error');
    }
};

onMounted(fetchData);
</script>

<template>
  <div v-if="evento" class="animate-in fade-in duration-500 max-w-7xl mx-auto p-4 md:p-8 space-y-8">
    
    <button @click="router.push('/coordinador/eventos')" class="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase hover:text-blue-600 transition-colors">
        <span class="material-symbols-outlined text-sm">arrow_back</span> Volver al Listado
    </button>

    <!-- Banner de Identidad -->
    <div class="relative w-full h-80 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-gray-800">
        <img :src="previewImg || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1600&q=80'" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
        <div class="absolute bottom-10 left-10">
            <span class="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg tracking-widest mb-4 inline-block">Gestión {{ evento.gestion }}</span>
            <h1 class="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase">{{ evento.nombre }}</h1>
            <p class="text-blue-100 font-bold uppercase text-[10px] tracking-widest mt-2">Configuración Maestra del Evento</p>
        </div>
    </div>

    <!-- Formulario de Configuración -->
    <div class="bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-sm border border-slate-100 dark:border-gray-800">
        <div class="flex justify-between items-center mb-10 border-b pb-6 border-slate-100 dark:border-gray-700">
            <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase italic">Configuración Web y Contenido</h3>
            <button @click="eliminarEvento" class="flex items-center gap-2 text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest transition-all">
                <span class="material-symbols-outlined text-sm">delete_forever</span> Eliminar todo el evento
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div class="space-y-6">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descripción del Evento (Sección 1)</label>
                    <textarea v-model="form.sobre_evento_1" rows="6" class="w-full p-5 bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl outline-none font-medium transition-all focus:border-blue-500"></textarea>
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descripción del Evento (Sección 2)</label>
                    <textarea v-model="form.sobre_evento_2" rows="6" class="w-full p-5 bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl outline-none font-medium transition-all focus:border-blue-500"></textarea>
                </div>
            </div>

            <div class="space-y-8">
                <div class="p-8 bg-blue-50/50 dark:bg-blue-950/20 rounded-[3rem] border-2 border-blue-100 dark:border-blue-900/50">
                    <label class="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 block text-center">Frase Destacada (Slogan)</label>
                    <textarea v-model="form.frase_destacada" rows="4" class="w-full p-5 bg-white dark:bg-gray-900 border-2 border-blue-100 dark:border-blue-900 rounded-3xl outline-none font-black italic text-xl text-center text-blue-800 dark:text-blue-300 shadow-inner"></textarea>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase mb-2 block">Nombre Sede / Ubicación</label>
                        <input v-model="form.ubicacion" class="w-full p-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl font-bold focus:border-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase mb-2 block">Banner Principal</label>
                        <div class="relative group h-14 bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer">
                            <span class="text-xs font-bold text-slate-400 uppercase group-hover:text-blue-600 select-none">Actualizar Imagen</span>
                            <input type="file" @change="handleFileChange" class="absolute inset-0 opacity-0 cursor-pointer">
                        </div>
                    </div>
                </div>

                <div class="pt-6">
                    <button @click="guardarCambios" class="w-full bg-primary-dark dark:bg-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                        Guardar Configuración
                    </button>
                    <p class="text-center text-[9px] text-slate-400 font-bold uppercase mt-4 tracking-tighter">* Los cambios se reflejarán inmediatamente en la vista pública (Home).</p>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in { animation: animate-in 0.5s ease-out; }
@keyframes animate-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
