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
const form = ref<any>({
    nombre: '',
    gestion: '',
    version: '',
    ubicacion: '',
    direccion: '',
    descripcion: '',
    frase_destacada: '',
    sobre_evento_1: '',
    sobre_evento_2: '',
    logo: null,
    imagen_fondo: null
});

// Previsualizaciones
const logoPreview = ref<string | null>(null);
const fondoPreview = ref<string | null>(null);

const fetchData = async () => {
    try {
        isLoading.value = true;
        const res = await api.get(`/eventos/${eventoId}`);
        evento.value = res.data;
        
        // Cargar datos en el form
        form.value = { 
            ...res.data,
            logo: null, // Reset para archivos
            imagen_fondo: null 
        };

        // URLs actuales para preview
        logoPreview.value = res.data.logo;
        fondoPreview.value = res.data.imagen_fondo;

    } catch (error) {
        Swal.fire('Error', 'No se pudo cargar el evento', 'error');
    } finally {
        isLoading.value = false;
    }
};

const onLogoChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        form.value.logo = file;
        logoPreview.value = URL.createObjectURL(file);
    }
};

const onFondoChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        form.value.imagen_fondo = file;
        fondoPreview.value = URL.createObjectURL(file);
    }
};

const guardarCambios = async () => {
    try {
        isLoading.value = true;
        const formData = new FormData();
        
        // Campos de texto
        Object.keys(form.value).forEach(key => {
            if (key !== 'logo' && key !== 'imagen_fondo' && form.value[key] !== null) {
                formData.append(key, String(form.value[key]));
            }
        });

        // Archivos reales
        if (form.value.logo instanceof File) formData.append('imagen_portada', form.value.logo);
        if (form.value.imagen_fondo instanceof File) formData.append('imagen_fondo', form.value.imagen_fondo);

        await api.put(`/admin/eventos/${eventoId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        Swal.fire('¡Éxito!', 'Los cambios se han guardado y publicado.', 'success');
        fetchData();
    } catch (err) {
        Swal.fire('Error', 'No se pudo actualizar el evento', 'error');
    } finally {
        isLoading.value = false;
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
            await api.delete(`/admin/eventos/${eventoId}`);
            Swal.fire('¡Eliminado!', 'El evento ha sido removido del sistema.', 'success');
            router.push('/coordinador/eventos');
        } catch (error) {
            Swal.fire('Error', 'No se pudo eliminar el evento.', 'error');
        }
    }
};

onMounted(fetchData);
</script>

<template>
    <div v-if="evento" class="animate-in fade-in duration-500 max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <button @click="router.push('/coordinador/eventos')" class="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase hover:text-blue-600 transition-colors">
                <span class="material-symbols-outlined text-sm">arrow_back</span> Volver al Listado
            </button>
            <div class="flex gap-3">
                <button @click="eliminarEvento" class="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">Eliminar Evento</button>
                <button @click="guardarCambios" :disabled="isLoading" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                    {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
            </div>
        </div>

        <!-- Layout de Diseño -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            <!-- FORMULARIO -->
            <div class="lg:col-span-7 space-y-8">
                
                <!-- Identidad -->
                <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-800 shadow-sm space-y-6">
                    <h3 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                        <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Identidad del Evento
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="md:col-span-2">
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Nombre Oficial</label>
                            <input v-model="form.nombre" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-50 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-blue-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Versión / Slogan</label>
                            <input v-model="form.version" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-50 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-blue-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Ubicación / Sede</label>
                            <input v-model="form.ubicacion" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-50 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-blue-500 outline-none transition-all">
                        </div>
                    </div>
                </div>

                <!-- Branding Visual -->
                <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-800 shadow-sm space-y-6">
                    <h3 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Multimedia y Branding
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase mb-3 block">Logo (Sustituir)</label>
                            <div class="relative group h-40 bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all">
                                <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain p-4">
                                <span class="absolute bottom-2 text-[8px] font-black text-blue-600 uppercase opacity-0 group-hover:opacity-100 transition-all">Cambiar Logo</span>
                                <input type="file" @change="onLogoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                            </div>
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase mb-3 block">Banner Hero (Sustituir)</label>
                            <div class="relative group h-40 bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-all">
                                <img v-if="fondoPreview" :src="fondoPreview" class="w-full h-full object-cover">
                                <span class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest transition-all">Cambiar Banner</span>
                                <input type="file" @change="onFondoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                            </div>
                        </div>
                    </div>

                    <div class="pt-4">
                        <label class="text-[9px] font-black text-slate-400 uppercase mb-2 block ml-1">Frase Destacada del Evento</label>
                        <textarea v-model="form.frase_destacada" rows="3" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-50 dark:border-gray-700 rounded-2xl px-5 py-4 text-lg font-black italic text-blue-800 dark:text-blue-300 focus:border-blue-500 outline-none transition-all"></textarea>
                    </div>
                </div>

                <!-- Contenido Detallado -->
                <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-800 shadow-sm space-y-6">
                    <h3 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                        <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
                        Contenido del Sitio Web
                    </h3>
                    <div class="space-y-6">
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase mb-2 block ml-1">Descripción del Evento (Párrafo 1)</label>
                            <textarea v-model="form.sobre_evento_1" rows="5" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-50 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-medium focus:border-blue-500 outline-none transition-all"></textarea>
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase mb-2 block ml-1">Descripción del Evento (Párrafo 2)</label>
                            <textarea v-model="form.sobre_evento_2" rows="5" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-50 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-medium focus:border-blue-500 outline-none transition-all"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PREVIEW STICKY -->
            <div class="lg:col-span-5">
                <div class="sticky top-8 space-y-6">
                    <div class="flex items-center justify-between px-2">
                        <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Preview Card</h3>
                        <span class="text-[8px] font-black text-emerald-500 uppercase px-2 py-0.5 bg-emerald-50 rounded-lg">Sincronizado</span>
                    </div>

                    <!-- Card Preview -->
                    <div class="bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-gray-700 transition-all">
                        <div class="relative h-48 bg-slate-100 overflow-hidden">
                            <img v-if="fondoPreview" :src="fondoPreview" class="w-full h-full object-cover">
                            <div class="absolute top-4 left-4 w-12 h-12 bg-white rounded-xl shadow-lg p-2 flex items-center justify-center">
                                <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain">
                            </div>
                            <div class="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                                {{ form.gestion }}
                            </div>
                        </div>

                        <div class="p-6 space-y-4">
                            <div>
                                <p class="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">{{ form.version }}</p>
                                <h4 class="text-lg font-black text-slate-800 dark:text-white leading-tight uppercase italic line-clamp-2">
                                    {{ form.nombre }}
                                </h4>
                            </div>
                            
                            <p class="text-[10px] text-slate-500 font-medium italic border-l-2 border-slate-200 pl-3 line-clamp-3">
                                "{{ form.frase_destacada || 'Frase del evento...' }}"
                            </p>

                            <div class="space-y-2 pt-2">
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                                    <span class="text-[9px] font-bold text-slate-600 uppercase">{{ form.ubicacion }}</span>
                                </div>
                            </div>

                            <button class="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest mt-2 opacity-50 cursor-not-allowed">
                                Ver Actividades
                            </button>
                        </div>
                    </div>

                    <div class="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <p class="text-[9px] text-amber-700 font-bold leading-relaxed">
                            <span class="material-symbols-outlined text-[14px] align-middle mr-1">warning</span>
                            Los cambios en las imágenes son permanentes. Al guardar, el servidor reemplazará los archivos anteriores para ahorrar espacio.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.animate-in { animation: animate-in 0.5s ease-out; }
@keyframes animate-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>

<style scoped>
.animate-in { animation: animate-in 0.5s ease-out; }
@keyframes animate-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
