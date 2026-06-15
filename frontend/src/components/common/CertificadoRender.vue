<script setup lang="ts">
import { computed } from 'vue';
import { getImageUrl } from '@/services/api';

const props = defineProps<{
    elementos: any[];
    fondoUrl?: string | null;
    variables?: Record<string, string>;
    zoom?: number;
    width?: number; // canvas original width, default 1024
    height?: number; // canvas original height, default 724
}>();

const defaultVariables = {
    '{NOMBRE_ESTUDIANTE}': 'Lic. Alejandro Leonardo Nogales Ticona',
    '{NOMBRE_COMPLETO_1}': 'Lic. Nogales Ticona Alejandro Leonardo',
    '{NOMBRE_COMPLETO_2}': 'Lic. Alejandro Leonardo Nogales Ticona',
    '{NOMBRE}': 'Lic. Alejandro Leonardo Nogales Ticona',
    '{NOMBRES}': 'Lic. Alejandro Leonardo Nogales Ticona',
    '{NOMBRES_APELLIDOS_SIN_GRADO}': 'Alejandro Leonardo Nogales Ticona',
    '{APELLIDOS_NOMBRES_SIN_GRADO}': 'Nogales Ticona Alejandro Leonardo',
    '{PRIMER_APELLIDO}': 'Nogales',
    '{SEGUNDO_APELLIDO}': 'Ticona',
    '{AREA_TEMATICA}': 'CIENCIAS DE LA VIDA Y DE LA TIERRA',
    '{DISCIPLINA}': 'BIOLOGÍA MOLECULAR',
    '{DISCIPLINA_CIENTIFICA}': 'BIOLOGÍA MOLECULAR',
    '{NOMBRE_CURSO}': 'Congreso Internacional de Biofertilizantes',
    '{EVENTO}': 'Congreso Internacional de Biofertilizantes',
    '{ACTIVIDAD}': 'Taller Avanzado de Suelos',
    '{CODIGO_CERTIFICADO}': 'CERT-TWAS-TYAN-2026-9842',
    '{GESTION}': '2026',
    '{ROL}': 'Asistente',
    '{CI_USUARIO}': '1234567 LP',
    '{CARGA_HORARIA}': '40 horas académicas',
    '{FECHA_EMISION}': '17 de Mayo de 2026',
    '{NOTA_FINAL}': '95',
    '{TEMATICA}': 'Innovaciones en Ciencias de la Vida'
};

const resolveVariables = (text: string) => {
    if (!text) return '';
    let resolved = text;
    const vars = props.variables || defaultVariables;
    for (const [key, value] of Object.entries(vars)) {
        // Usar split.join para reemplazar todas las ocurrencias de forma segura (sin Regex)
        resolved = resolved.split(key).join(value);
        
        // También intentar con corchetes y llaves dobles por si el usuario los escribió así
        const cleanKey = key.replace(/[\{\}]/g, '');
        resolved = resolved.split(`[${cleanKey}]`).join(value);
        resolved = resolved.split(`{{${cleanKey}}}`).join(value);
    }
    return resolved;
};

const scale = computed(() => props.zoom || 1.0);
const canvasW = computed(() => props.width || 1024);
const canvasH = computed(() => props.height || 724);

</script>

<template>
    <!-- Sizing Layout Box for Zoom -->
    <div class="relative transition-all duration-200 flex items-center justify-center shrink-0" 
         :style="{ width: `${canvasW * scale}px`, height: `${canvasH * scale}px` }">
         
        <!-- Certificado Canvas -->
        <div class="absolute left-1/2 top-1/2 bg-white shadow-2xl border border-slate-350 flex items-start justify-start rounded-xl overflow-hidden transition-transform duration-200 shrink-0"
             :style="{ 
                width: `${canvasW}px`,
                height: `${canvasH}px`,
                backgroundImage: props.fondoUrl ? `url(${getImageUrl('fondos', props.fondoUrl)})` : undefined,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transform: `translate(-50%, -50%) scale(${scale})`,
                transformOrigin: 'center center'
             }">
             
            <!-- Elementos Dinámicos -->
            <div v-for="el in props.elementos" :key="el.id"
                 class="absolute flex items-start text-center select-none text-slate-800 dark:text-slate-800"
                 :style="{ 
                    left: `${el.x}%`, 
                    top: `${el.y}%`, 
                    fontSize: el.tipo !== 'qr' && el.tipo !== 'firma' && el.tipo !== 'firma_individual' ? `${el.fontSize}px` : undefined, 
                    color: el.color || '#000000', 
                    fontFamily: el.fontFamily || 'Arial',
                    width: el.width ? `${el.width}px` : 'auto',
                    height: el.height ? `${el.height}px` : 'auto',
                    textAlign: (el.alineacion || 'center') as any,
                    justifyContent: el.alineacion === 'left' ? 'flex-start' : (el.alineacion === 'right' ? 'flex-end' : 'center')
                 }">
                 
                 <!-- Tipo: Cabecera -->
                 <div v-if="el.tipo === 'cabecera'" class="font-black uppercase leading-none w-full flex flex-col pt-[0.1em]">
                    {{ el.valor || '[ CABECERA ]' }}
                 </div>
                 
                 <!-- Tipo: Tenor -->
                 <div v-else-if="el.tipo === 'tenor'" class="leading-none italic whitespace-pre-line w-full flex flex-col pt-[0.1em]">
                    {{ resolveVariables(el.valor) }}
                 </div>
                 
                 <!-- Tipo: Texto (Variables) -->
                 <div v-else-if="el.tipo === 'texto'" class="font-bold leading-none whitespace-pre-line w-full flex flex-col pt-[0.1em]" :style="{ textTransform: el.textTransform || 'none' }">
                    {{ resolveVariables(el.valor) }}
                 </div>
                 
                 <!-- Tipo: QR -->
                 <div v-else-if="el.tipo === 'qr'" class="bg-white flex items-center justify-center shrink-0 overflow-hidden" :style="{ width: el.width ? `${el.width}px` : '100px', height: el.height ? `${el.height}px` : (el.width ? `${el.width}px` : '100px') }">
                    <span class="material-symbols-outlined text-slate-800 select-none" :style="{ fontSize: el.width ? `${el.width}px` : '100px' }">qr_code_2</span>
                 </div>
                 
                 <!-- Tipo: Firma (Bloque) -->
                 <div v-else-if="el.tipo === 'firma'" class="w-full h-[120px] flex items-center justify-evenly gap-4 p-4 relative shrink-0">
                    <div v-for="i in 3" :key="i" class="flex flex-col items-center justify-end h-full flex-1">
                        <div class="w-full max-w-[120px] border-b border-black mb-2 flex items-end justify-center pb-1 h-12">
                            <span class="font-serif italic text-slate-400 text-[10px] select-none">Firma Autorizada</span>
                        </div>
                        <p class="text-[9px] font-bold text-black uppercase leading-tight">Autoridad {{ i }}</p>
                        <p class="text-[7px] font-black text-black uppercase leading-tight tracking-wider opacity-80">Rectorado</p>
                    </div>
                 </div>

                 <!-- Tipo: Firma Individual -->
                 <div v-else-if="el.tipo === 'firma_individual'" class="w-full h-[120px] flex flex-col items-center justify-end pb-4 relative shrink-0">
                    <div class="w-full border-b border-black mb-2 flex items-end justify-center pb-1 h-12">
                        <span class="font-serif italic text-slate-400 text-[10px] select-none">Firma Autorizada</span>
                    </div>
                    <p class="text-[9px] font-bold text-black uppercase leading-tight">Autoridad Asignada</p>
                    <p class="text-[7px] font-black text-black uppercase leading-tight tracking-wider opacity-80">Cargo</p>
                 </div>
                 
            </div>
        </div>
    </div>
</template>
