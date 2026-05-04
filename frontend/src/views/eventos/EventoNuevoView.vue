<script setup lang="ts">
import { ref, computed } from 'vue';
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
    frase_destacada: '',
    logo: '',
    imagen_fondo: '',
    estado: 1
});

// Previsualización de imágenes
const logoPreview = ref<string | null>(null);
const fondoPreview = ref<string | null>(null);

const logoFile = ref<File | null>(null);
const fondoFile = ref<File | null>(null);

const onLogoChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        logoFile.value = file;
        logoPreview.value = URL.createObjectURL(file);
    }
};

const onFondoChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        fondoFile.value = file;
        fondoPreview.value = URL.createObjectURL(file);
    }
};

const handleCreate = async () => {
    if (!form.value.nombre) {
        Swal.fire('Atención', 'El nombre del evento es obligatorio', 'warning');
        return;
    }

    try {
        loading.value = true;
        
        const formData = new FormData();
        // Añadir campos del formulario
        Object.entries(form.value).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        // Añadir archivos
        if (logoFile.value) formData.append('imagen_portada', logoFile.value);
        if (fondoFile.value) formData.append('imagen_fondo', fondoFile.value);

        await api.post('/admin/eventos', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        Swal.fire('¡Éxito!', 'Evento creado y publicado con éxito.', 'success');
        router.push('/coordinador/eventos');
    } catch (error) {
        Swal.fire('Error', 'No se pudo crear el evento. Revisa la conexión.', 'error');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="border-b border-slate-200 dark:border-gray-800 mb-8 pb-6 flex justify-between items-end">
        <div>
            <h2 class="text-2xl md:text-3xl font-black text-primary-dark dark:text-white uppercase italic">Nuevo Evento</h2>
            <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Diseña la identidad visual de tu nueva gestión</p>
        </div>
        <div class="hidden md:block">
            <span class="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Modo Diseñador Activo</span>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- FORMULARIO DE EDICIÓN -->
        <div class="lg:col-span-7 space-y-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-slate-100 dark:border-gray-800 shadow-sm space-y-6">
                
                <h3 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Información Básica
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nombre del Evento</label>
                        <input v-model="form.nombre" type="text" placeholder="Ej: Congreso Internacional TWAS-TYAN" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Gestión</label>
                        <input v-model="form.gestion" type="text" placeholder="2025" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Versión / Slogan</label>
                        <input v-model="form.version" type="text" placeholder="Ej: 4ta Edición" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                    </div>
                </div>

                <div class="pt-4">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Frase Destacada (Aparece en el banner)</label>
                    <input v-model="form.frase_destacada" type="text" placeholder="Ej: Ciencia y Tecnología para el desarrollo" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold italic focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                </div>
            </div>

            <!-- Branding -->
            <div class="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-slate-100 dark:border-gray-800 shadow-sm space-y-6">
                <h3 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Branding Visual
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Logo Upload -->
                    <div class="space-y-3">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo del Evento</label>
                        <div class="relative group">
                            <div class="aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden transition-all group-hover:border-blue-400">
                                <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain">
                                <template v-else>
                                    <span class="material-symbols-outlined text-slate-300 text-4xl mb-2">image</span>
                                    <span class="text-[9px] text-slate-400 font-bold uppercase">Click para subir</span>
                                </template>
                                <input type="file" @change="onLogoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                            </div>
                        </div>
                    </div>

                    <!-- Imagen Fondo -->
                    <div class="space-y-3">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Imagen de Fondo (Hero)</label>
                        <div class="relative group">
                            <div class="aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden transition-all group-hover:border-blue-400">
                                <img v-if="fondoPreview" :src="fondoPreview" class="w-full h-full object-cover">
                                <template v-else>
                                    <span class="material-symbols-outlined text-slate-300 text-4xl mb-2">wallpaper</span>
                                    <span class="text-[9px] text-slate-400 font-bold uppercase">Banner principal</span>
                                </template>
                                <input type="file" @change="onFondoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- LIVE PREVIEW CARD -->
        <div class="lg:col-span-5">
            <div class="sticky top-8 space-y-6">
                <div class="flex items-center justify-between px-2">
                    <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vista Previa en Vivo</h3>
                    <div class="flex gap-1">
                        <div class="w-2 h-2 rounded-full bg-red-400/20"></div>
                        <div class="w-2 h-2 rounded-full bg-amber-400/20"></div>
                        <div class="w-2 h-2 rounded-full bg-emerald-400/20"></div>
                    </div>
                </div>

                <!-- Simulación de Tarjeta del Home -->
                <div class="bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-gray-700 group transition-all">
                    <!-- Banner -->
                    <div class="relative h-48 bg-slate-100 overflow-hidden">
                        <img v-if="fondoPreview" :src="fondoPreview" class="w-full h-full object-cover">
                        <div v-else class="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <span class="text-slate-400 font-black text-4xl opacity-20 italic uppercase">{{ form.gestion || '202X' }}</span>
                        </div>
                        
                        <!-- Overlay Logo -->
                        <div class="absolute top-4 left-4 w-12 h-12 bg-white rounded-xl shadow-lg p-2 flex items-center justify-center">
                            <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain">
                            <span v-else class="text-[8px] font-black text-slate-300 uppercase">Logo</span>
                        </div>

                        <!-- Badge -->
                        <div class="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                            {{ form.gestion || 'Gestión' }}
                        </div>
                    </div>

                    <!-- Contenido -->
                    <div class="p-6 space-y-4">
                        <div>
                            <p class="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">{{ form.version || 'Versión del Evento' }}</p>
                            <h4 class="text-lg font-black text-slate-800 dark:text-white leading-tight uppercase italic line-clamp-2">
                                {{ form.nombre || 'Nombre de tu Evento' }}
                            </h4>
                        </div>
                        
                        <p class="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-3 italic border-l-2 border-slate-200 pl-3">
                            "{{ form.frase_destacada || 'Aquí aparecerá tu frase destacada o slogan principal para inspirar a los estudiantes.' }}"
                        </p>

                        <!-- Detalles adicionales en preview -->
                        <div class="space-y-2 py-2">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                                <span class="text-[9px] font-bold text-slate-600 uppercase tracking-tight">
                                    {{ form.ubicacion || 'Sede' }} - {{ form.direccion || 'Dirección específica' }}
                                </span>
                            </div>
                            <div class="flex items-start gap-2">
                                <span class="material-symbols-outlined text-[14px] text-slate-400 mt-0.5">description</span>
                                <p class="text-[9px] text-slate-400 font-medium line-clamp-2 leading-snug">
                                    {{ form.descripcion || 'Aquí se mostrará un breve resumen de lo que trata el evento académico...' }}
                                </p>
                            </div>
                        </div>

                        <button class="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest mt-2 opacity-50 cursor-not-allowed">
                            Ver Actividades Académicas
                        </button>
                    </div>
                </div>

                <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p class="text-[9px] text-blue-600 font-bold leading-relaxed">
                        <span class="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                        Esta es una representación de cómo los estudiantes visualizarán el evento en la pantalla principal. Asegúrate de que el logo tenga fondo transparente para un mejor acabado.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- BOTONES DE ACCIÓN -->
    <div class="flex flex-col md:flex-row justify-end items-center gap-4 mt-12 pt-8 border-t border-slate-100 dark:border-gray-800">
        <button @click="router.back()" class="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
        <button @click="handleCreate" :disabled="loading" class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black px-16 py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all">
            {{ loading ? 'Publicando...' : 'Crear y Publicar Evento' }}
        </button>
    </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
