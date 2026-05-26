<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const loading = ref(false);

const form = ref({
    nombre: '',
    sigla: '',
    badge_text: 'EVENTO OFICIAL OEA/TYAN',
    gestion: new Date().getFullYear().toString(),
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

// Resolución inteligente de URLs para Vista Previa
const resolvedLogo = computed(() => {
    if (!logoPreview.value) return null;
    return logoPreview.value;
});

const resolvedBanner = computed(() => {
    if (!fondoPreview.value) return null;
    return fondoPreview.value;
});

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
    <div class="animate-in fade-in duration-500">
        <div class="border-b border-slate-200 dark:border-gray-800 mb-8 pb-6 flex justify-between items-end">
            <div>
                <h2 class="text-2xl md:text-3xl font-black text-primary-dark dark:text-white uppercase italic">Nuevo Evento Académico</h2>
                <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Diseña la identidad visual y narrativa de tu nueva gestión</p>
            </div>
            <div class="hidden md:block">
                <span class="px-4 py-1.5 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-100 dark:border-sky-800">Modo Estructura Activo</span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- FORMULARIO DE EDICIÓN -->
            <div class="lg:col-span-7 space-y-6">
                <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-slate-100 dark:border-gray-800 shadow-sm space-y-6">
                    
                    <h3 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                        <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
                        Identidad y Narrativa
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div class="md:col-span-12">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nombre Principal del Evento</label>
                            <input v-model="form.nombre" type="text" placeholder="Ej: Congreso Internacional TWAS-TYAN" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none transition-all">
                        </div>
                        
                        <div class="md:col-span-6">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sigla / Abreviación (Para el Header)</label>
                            <input v-model="form.sigla" type="text" placeholder="Ej: TYAN" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold uppercase focus:ring-2 focus:ring-umsa-blue outline-none">
                        </div>

                        <div class="md:col-span-6">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Texto del Badge (Botón Verde)</label>
                            <input v-model="form.badge_text" type="text" placeholder="Evento Oficial..." class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-[10px] font-black uppercase focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600">
                        </div>

                        <div class="md:col-span-4">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Gestión</label>
                            <input v-model="form.gestion" type="text" placeholder="2025" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none">
                        </div>
                        
                        <div class="md:col-span-8">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Versión / Slogan</label>
                            <input v-model="form.version" type="text" placeholder="Ej: 4ta Edición" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-umsa-blue outline-none">
                        </div>

                        <div class="md:col-span-12">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Frase Destacada (Impacto en Banner)</label>
                            <input v-model="form.frase_destacada" type="text" placeholder="Ej: Ciencia para el desarrollo sostenible" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-5 py-3.5 text-sm font-bold italic focus:ring-2 focus:ring-umsa-blue outline-none">
                        </div>
                    </div>

                    <div class="pt-4">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Resumen del Evento (Narrativa)</label>
                        <textarea v-model="form.descripcion" rows="4" placeholder="Escribe aquí el resumen que verán los estudiantes..." class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-umsa-blue outline-none"></textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Ciudad / Sede</label>
                            <input v-model="form.ubicacion" type="text" placeholder="La Paz, Bolivia" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold">
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Dirección Detallada</label>
                            <input v-model="form.direccion" type="text" placeholder="Campus Central UMSA" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold">
                        </div>
                    </div>
                </div>

                <!-- Branding Visual -->
                <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-slate-100 dark:border-gray-800 shadow-sm space-y-6">
                    <h3 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Branding Visual
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Logo Upload -->
                        <div class="space-y-4">
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo del Evento</label>
                                <p class="text-[8px] font-bold text-slate-400 uppercase mt-0.5">PNG/SVG Transparente • 512x512px</p>
                            </div>
                            <div class="relative group">
                                <div class="aspect-square rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 flex flex-col items-center justify-center p-4 overflow-hidden transition-all group-hover:border-blue-400">
                                    <img v-if="resolvedLogo" :src="resolvedLogo" class="w-full h-full object-contain">
                                    <template v-else>
                                        <span class="material-symbols-outlined text-slate-300 text-4xl mb-2">image</span>
                                        <span class="text-[9px] text-slate-400 font-bold uppercase">Subir Logo Oficial</span>
                                    </template>
                                    <input type="file" @change="onLogoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                                </div>
                            </div>
                        </div>

                        <!-- Imagen Fondo -->
                        <div class="space-y-4">
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Banner Principal (Hero)</label>
                                <p class="text-[8px] font-bold text-slate-400 uppercase mt-0.5">JPG/PNG • Full HD (1920x1080px)</p>
                            </div>
                            <div class="relative group">
                                <div class="aspect-video rounded-2xl bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 flex flex-col items-center justify-center p-4 overflow-hidden transition-all group-hover:border-blue-400">
                                    <img v-if="resolvedBanner" :src="resolvedBanner" class="w-full h-full object-cover">
                                    <template v-else>
                                        <span class="material-symbols-outlined text-slate-300 text-4xl mb-2">wallpaper</span>
                                        <span class="text-[9px] text-slate-400 font-bold uppercase">Subir Fondo Hero</span>
                                    </template>
                                    <input type="file" @change="onFondoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- LIVE PREVIEW CARD (MINI-HOME FIDELITY) -->
            <div class="lg:col-span-5">
                <div class="sticky top-8 space-y-6">
                    <div class="flex items-center justify-between px-2">
                        <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Simulación de Home Real</h3>
                        <div class="flex gap-1">
                            <div class="w-2 h-2 rounded-full bg-red-400/20"></div>
                            <div class="w-2 h-2 rounded-full bg-amber-400/20"></div>
                            <div class="w-2 h-2 rounded-full bg-emerald-400/20"></div>
                        </div>
                    </div>

                    <!-- Simulación Unificada -->
                    <div class="bg-white dark:bg-gray-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-gray-800 group transition-all">
                        <!-- Banner Section -->
                        <div class="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                            <img v-if="resolvedBanner" :src="resolvedBanner" class="absolute inset-0 w-full h-full object-cover opacity-60 animate-in fade-in duration-700">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                            
                            <!-- Mini Logo & Sigla -->
                            <div class="absolute top-4 left-4 z-20 flex items-center gap-2">
                                <div class="w-10 h-10 bg-white/95 backdrop-blur rounded-lg p-1.5 shadow-lg flex items-center justify-center">
                                    <img v-if="resolvedLogo" :src="resolvedLogo" class="w-full h-full object-contain">
                                    <span v-else class="material-symbols-outlined text-slate-300 text-lg">image</span>
                                </div>
                                <span class="text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-md">{{ form.sigla || 'Sigla' }}</span>
                            </div>

                            <!-- Top Right Badge -->
                            <div class="absolute top-4 right-4 z-20">
                                <div class="px-2 py-1 bg-emerald-500 text-white text-[7px] font-black rounded border border-emerald-400 uppercase shadow-lg">
                                    {{ form.badge_text || 'Badge Oficial' }}
                                </div>
                            </div>

                            <!-- Hero Content -->
                            <div class="absolute inset-x-0 bottom-0 p-6 space-y-2">
                                <h4 class="text-xl font-black text-white leading-[0.9] uppercase italic tracking-tighter drop-shadow-2xl">
                                    {{ form.nombre || 'Nombre del Evento' }}
                                </h4>
                                
                                <div class="flex gap-1.5 pt-1">
                                    <div class="px-2 py-0.5 bg-sky-500/20 backdrop-blur border border-sky-400/30 text-sky-200 rounded text-[7px] font-black uppercase">
                                        {{ form.gestion || '202X' }}
                                    </div>
                                    <div class="px-2 py-0.5 bg-white/10 backdrop-blur border border-white/20 text-white rounded text-[7px] font-black uppercase">
                                        {{ form.ubicacion || 'Sede' }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Narrative Content -->
                        <div class="p-6 space-y-4">
                            <div class="space-y-2">
                                <h5 class="text-[9px] font-black text-blue-600 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                    <span class="w-4 h-[1px] bg-blue-600"></span>
                                    Sobre el Evento
                                </h5>
                                <p class="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                                    {{ form.descripcion || 'Aquí aparecerá el resumen que escribas en el formulario para invitar a los participantes.' }}
                                </p>
                            </div>
                            
                            <div v-if="form.frase_destacada" class="bg-slate-50 dark:bg-gray-900 p-4 rounded-2xl border border-slate-100 dark:border-gray-800 relative">
                                <p class="text-[9px] font-black italic text-center text-slate-700 dark:text-slate-300 leading-tight">
                                    "{{ form.frase_destacada }}"
                                </p>
                            </div>

                            <!-- Buttons Simulation -->
                            <div class="grid grid-cols-2 gap-2 pt-2 opacity-50">
                                <div class="h-8 bg-blue-600 rounded-full flex items-center justify-center text-[7px] font-black text-white uppercase">Ingresar</div>
                                <div class="h-8 border border-slate-200 dark:border-gray-800 rounded-full flex items-center justify-center text-[7px] font-black text-slate-400 uppercase">Detalles</div>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                        <p class="text-[8px] text-emerald-600 font-bold leading-relaxed uppercase tracking-tighter">
                            <span class="material-symbols-outlined text-[14px] align-middle mr-1">check_circle</span>
                            Simulación en tiempo real. Todos los cambios se reflejan al instante.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- BOTONES DE ACCIÓN -->
        <div class="flex flex-col md:flex-row justify-end items-center gap-4 mt-12 pt-8 border-t border-slate-100 dark:border-gray-800 pb-12">
            <button @click="router.back()" class="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
            <button @click="handleCreate" :disabled="loading" class="w-full md:w-auto bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white font-black px-16 py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-50 transition-all">
                {{ loading ? 'Publicando...' : 'Crear y Publicar Gestión' }}
            </button>
        </div>
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
