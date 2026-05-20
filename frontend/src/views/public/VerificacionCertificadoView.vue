<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const uuid = route.params.uuid as string

const loading = ref(true)
const resultado = ref<any>(null)
const errorMsg = ref('')

onMounted(async () => {
    try {
        const response = await api.get(`/public/certificados/verificar/${uuid}`)
        resultado.value = response.data
    } catch (error: any) {
        console.error(error)
        errorMsg.value = error.response?.data?.message || 'El certificado no es válido o ha expirado.'
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 font-sans">
        
        <!-- Header -->
        <div class="mb-10 text-center">
            <div class="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center justify-center mx-auto mb-4">
                <span class="material-symbols-outlined text-4xl text-umsa-blue">verified_user</span>
            </div>
            <h1 class="text-2xl font-black text-primary-dark dark:text-white tracking-tight">Verificación de Certificado</h1>
            <p class="text-sm text-slate-500 dark:text-gray-400 mt-2 font-medium">Sistema de Certificación Académica</p>
        </div>

        <!-- Loader -->
        <div v-if="loading" class="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl p-8 text-center border border-slate-100 dark:border-gray-700">
            <span class="material-symbols-outlined animate-spin text-4xl text-umsa-gold mb-4">autorenew</span>
            <p class="text-sm font-bold text-slate-600 dark:text-gray-300 animate-pulse">Verificando firma digital...</p>
        </div>

        <!-- Resultado Éxito -->
        <div v-else-if="resultado && resultado.valido" class="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/30">
            <!-- Banner Verde -->
            <div class="bg-emerald-500 p-6 text-center relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
                <span class="material-symbols-outlined text-[64px] text-white drop-shadow-md mb-2 relative z-10">check_circle</span>
                <h2 class="text-2xl font-black text-white tracking-tight relative z-10">Certificado Auténtico</h2>
                <div class="inline-block mt-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold uppercase tracking-widest relative z-10 border border-white/30">
                    ID: {{ resultado.certificado.uuid.split('-')[0] }}...
                </div>
            </div>

            <!-- Datos del Certificado -->
            <div class="p-8 space-y-6">
                <!-- Participante -->
                <div>
                    <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                        <span class="material-symbols-outlined text-[14px]">person</span> Otorgado a
                    </label>
                    <p class="text-lg font-black text-primary-dark dark:text-white leading-tight">
                        {{ resultado.participante.nombre }}
                    </p>
                    <p class="text-xs text-slate-500 font-mono mt-1">CI: {{ resultado.participante.documento }}</p>
                </div>

                <hr class="border-slate-100 dark:border-gray-700" />

                <!-- Evento -->
                <div>
                    <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                        <span class="material-symbols-outlined text-[14px]">event</span> Actividad Académica
                    </label>
                    <p class="text-sm font-bold text-slate-700 dark:text-gray-200">
                        {{ resultado.evento.nombre }}
                    </p>
                    <div class="flex items-center gap-4 mt-3">
                        <div class="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                            <span class="text-[9px] uppercase font-black text-blue-500 block mb-0.5">Participación</span>
                            <span class="text-xs font-bold text-blue-700 dark:text-blue-300">{{ resultado.certificado.tipo_participacion }}</span>
                        </div>
                        <div class="bg-slate-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700">
                            <span class="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Emisión</span>
                            <span class="text-xs font-bold text-slate-700 dark:text-gray-300">
                                {{ new Date(resultado.certificado.fecha_emision).toLocaleDateString('es-BO') }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resultado Error -->
        <div v-else class="w-full max-w-md bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl p-8 text-center border border-red-100 dark:border-red-900/30 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            <div class="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="material-symbols-outlined text-[48px] text-red-500">gpp_bad</span>
            </div>
            <h2 class="text-xl font-black text-slate-800 dark:text-white mb-2">Certificado No Válido</h2>
            <p class="text-sm font-medium text-slate-500 dark:text-gray-400 mb-6">{{ errorMsg }}</p>
            <button @click="$router.push('/')" class="w-full py-3 px-4 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors">
                Ir al Inicio
            </button>
        </div>

        <!-- Footer -->
        <div class="mt-12 text-center opacity-50 flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px]">security</span>
            <span class="text-[10px] font-bold uppercase tracking-widest">Documento protegido criptográficamente</span>
        </div>
    </div>
</template>
