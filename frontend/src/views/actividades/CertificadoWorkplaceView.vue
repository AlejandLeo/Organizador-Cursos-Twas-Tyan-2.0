<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { getImageUrl } from '@/services/api'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const eventoId = route.params.id
const tipoCertificado = ref<number>(Number(route.query.tipo || 1))
const esExcelencia = ref<number>(route.query.es_excelencia !== undefined ? Number(route.query.es_excelencia) : 0)

const showPreviewModal = ref(false)

const resolvePreviewVariables = (text: string) => {
    if (!text) return ''
    return text
        .replace(/{NOMBRE_ESTUDIANTE}/g, 'Lic. Alejandro Leonardo Nogales')
        .replace(/{PRIMER_APELLIDO}/g, 'Nogales')
        .replace(/{SEGUNDO_APELLIDO}/g, 'Ticona')
        .replace(/{NOMBRE_CURSO}/g, 'Congreso Internacional de Biofertilizantes')
        .replace(/{EVENTO}/g, 'Congreso Internacional de Biofertilizantes')
        .replace(/{ACTIVIDAD}/g, 'Taller Avanzado de Suelos')
        .replace(/{CODIGO_CERTIFICADO}/g, 'CERT-TWAS-TYAN-2026-9842')
}

const resolvePreviewTenor = (text: string) => {
    if (!text) return '[ TENOR PENDIENTE ]'
    return resolvePreviewVariables(text)
}

interface ElementoLienzo {
  id: string
  tipo: string
  valor: string
  x: number // Porcentaje (0-100)
  y: number // Porcentaje (0-100)
  width?: number // Ancho en px
  height?: number // Alto en px
  fontSize: number
  color: string
  fontFamily: string
}

const infoCertificado = ref<any>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

const elementosLienzo = ref<ElementoLienzo[]>([])
const elementoSeleccionado = ref<string | null>(null)
const selectedElementData = ref<ElementoLienzo | null>(null)

const fetchData = async () => {
    try {
        if (eventoId) {
            let url = `/info-certificados/evento/${eventoId}?tipo=${tipoCertificado.value}`
            if (Number(tipoCertificado.value) === 4) {
                url += `&es_excelencia=${esExcelencia.value}`
            }
            const infoRes = await api.get(url)
            if (infoRes.data && infoRes.data.length > 0) {
                infoCertificado.value = infoRes.data[0]
                if (infoCertificado.value.configuracion) {
                    try {
                        elementosLienzo.value = typeof infoCertificado.value.configuracion === 'string' 
                            ? JSON.parse(infoCertificado.value.configuracion) 
                            : infoCertificado.value.configuracion
                    } catch(e) {
                        elementosLienzo.value = []
                    }
                } else {
                    elementosLienzo.value = []
                }
            } else {
                infoCertificado.value = {
                    cabecera: '',
                    tenor: '',
                    estado: 1
                }
                elementosLienzo.value = []
            }
        }
    } catch (error) {
        console.error('Error fetching data', error)
        infoCertificado.value = {
            cabecera: '',
            tenor: '',
            estado: 1
        }
        elementosLienzo.value = []
    }
}

onMounted(() => {
    fetchData()
})

watch([tipoCertificado, esExcelencia], async () => {
    elementoSeleccionado.value = null
    selectedElementData.value = null
    elementosLienzo.value = []
    infoCertificado.value = null
    await fetchData()
})

const triggerUpload = () => {
    if (!infoCertificado.value) {
        return Swal.fire('Atención', 'Primero debes guardar la configuración en la vista anterior.', 'warning')
    }
    fileInput.value?.click()
}

const onFileChange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        const file = target.files[0]
        if (!file) return;
        const formData = new FormData()
        formData.append('fondo', file as Blob)
        try {
            Swal.fire({ title: 'Subiendo fondo...', didOpen: () => Swal.showLoading() })
            await api.post(`/info-certificados/${infoCertificado.value.id}/fondo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            await fetchData()
            Swal.fire('Éxito', 'Imagen de fondo actualizada.', 'success')
        } catch (error) {
            console.error(error)
            Swal.fire('Error', 'No se pudo subir el fondo.', 'error')
        }
    }
}

const goBack = () => {
    router.push({ name: 'coordinador-gestion-eventos', query: { edit: eventoId, step: 7 } })
}

// === DRAG AND DROP LOGIC ===
const zoomLevel = ref(1)
const isDraggingCanvasId = ref<string | null>(null)

const zoomIn = () => { if (zoomLevel.value < 2) zoomLevel.value += 0.1 }
const zoomOut = () => { if (zoomLevel.value > 0.3) zoomLevel.value -= 0.1 }

const onDragStartPalette = (e: DragEvent, tipo: string, valor: string) => {
    e.dataTransfer?.setData('application/json', JSON.stringify({ source: 'palette', tipo, valor }))
}

const onDragStartCanvas = (e: DragEvent, id: string) => {
    isDraggingCanvasId.value = id
    e.dataTransfer?.setData('application/json', JSON.stringify({ source: 'canvas', id }))
    const target = e.target as HTMLElement
    const rect = target.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    e.dataTransfer?.setData('offsetX', offsetX.toString())
    e.dataTransfer?.setData('offsetY', offsetY.toString())
}

const onDragEndCanvas = () => {
    isDraggingCanvasId.value = null
}

const onDropCanvas = (e: DragEvent) => {
    const dataStr = e.dataTransfer?.getData('application/json')
    if (!dataStr) return
    const data = JSON.parse(dataStr)

    if (!canvasRef.value) return
    const canvasRect = canvasRef.value.getBoundingClientRect()
    
    let dropX = e.clientX - canvasRect.left
    let dropY = e.clientY - canvasRect.top
    
    if (data.source === 'canvas') {
        const offX = Number(e.dataTransfer?.getData('offsetX') || 0)
        const offY = Number(e.dataTransfer?.getData('offsetY') || 0)
        dropX -= offX
        dropY -= offY
    } else {
        // Compensate for palette dragging so it drops roughly centered
        dropX -= data.tipo === 'firma' || data.tipo === 'cabecera' || data.tipo === 'tenor' ? (300 * zoomLevel.value) : (60 * zoomLevel.value)
        dropY -= 20 * zoomLevel.value
    }

    const xPercent = (dropX / canvasRect.width) * 100
    const yPercent = (dropY / canvasRect.height) * 100

    if (data.source === 'palette') {
        elementosLienzo.value.push({
            id: Date.now().toString(),
            tipo: data.tipo,
            valor: data.valor,
            x: xPercent,
            y: yPercent,
            width: data.tipo === 'qr' ? 100 : (data.tipo === 'firma' || data.tipo === 'cabecera' || data.tipo === 'tenor' ? 600 : undefined),
            height: data.tipo === 'qr' ? 100 : undefined,
            fontSize: 24,
            color: '#000000',
            fontFamily: 'Arial'
        })
    } else if (data.source === 'canvas') {
        const item = elementosLienzo.value.find(el => el.id === data.id)
        if (item) {
            item.x = xPercent
            item.y = yPercent
        }
    }
}

const selectElement = (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation()
    elementoSeleccionado.value = id
    selectedElementData.value = elementosLienzo.value.find(el => el.id === id) || null
}

const deleteElement = (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation()
    elementosLienzo.value = elementosLienzo.value.filter(el => el.id !== id)
    if (elementoSeleccionado.value === id) {
        elementoSeleccionado.value = null
        selectedElementData.value = null
    }
}

// === RESIZING LOGIC ===
const isResizing = ref(false)
const resizeElement = ref<ElementoLienzo | null>(null)
const resizeDirection = ref<'width' | 'height' | 'both'>('width')
const startResizeX = ref(0)
const startResizeY = ref(0)
const startResizeWidth = ref(0)
const startResizeHeight = ref(0)

const startResize = (e: MouseEvent, el: ElementoLienzo, direction: 'width' | 'height' | 'both') => {
    e.stopPropagation()
    e.preventDefault()
    isResizing.value = true
    resizeElement.value = el
    resizeDirection.value = direction
    startResizeX.value = e.clientX
    startResizeY.value = e.clientY
    
    // Si no tiene width/height, inicializamos un valor por defecto al comenzar
    startResizeWidth.value = el.width || (el.tipo === 'qr' ? 100 : (el.tipo === 'texto' ? 200 : 600))
    startResizeHeight.value = el.height || (el.tipo === 'qr' ? 100 : (el.tipo === 'texto' ? 40 : 120))

    document.addEventListener('mousemove', onMouseMoveResize)
    document.addEventListener('mouseup', onMouseUpResize)
}

const onMouseMoveResize = (e: MouseEvent) => {
    if (!isResizing.value || !resizeElement.value) return
    
    if (resizeElement.value.tipo === 'qr') {
        const diffX = (e.clientX - startResizeX.value) / zoomLevel.value
        const diffY = (e.clientY - startResizeY.value) / zoomLevel.value
        const maxDiff = Math.max(diffX, diffY)
        const newSize = Math.max(50, startResizeWidth.value + maxDiff)
        resizeElement.value.width = newSize
        resizeElement.value.height = newSize
        return
    }

    if (resizeDirection.value === 'width' || resizeDirection.value === 'both') {
        const diffX = (e.clientX - startResizeX.value) / zoomLevel.value
        resizeElement.value.width = Math.max(50, startResizeWidth.value + diffX)
    }
    
    if (resizeDirection.value === 'height' || resizeDirection.value === 'both') {
        const diffY = (e.clientY - startResizeY.value) / zoomLevel.value
        resizeElement.value.height = Math.max(20, startResizeHeight.value + diffY)
    }
}

const onMouseUpResize = () => {
    isResizing.value = false
    resizeElement.value = null
    document.removeEventListener('mousemove', onMouseMoveResize)
    document.removeEventListener('mouseup', onMouseUpResize)
}

const deselectElement = () => {
    elementoSeleccionado.value = null
    selectedElementData.value = null
}

const guardarDiseno = async () => {
    if (!infoCertificado.value) return Swal.fire('Atención', 'Primero debes guardar la cabecera en el paso 7.', 'warning')
    try {
        Swal.fire({ title: 'Guardando diseño...', didOpen: () => Swal.showLoading() })
        const payload: any = {
            id_evento: Number(eventoId),
            tipo: Number(tipoCertificado.value),
            cabecera: infoCertificado.value.cabecera,
            tenor: infoCertificado.value.tenor,
            configuracion: elementosLienzo.value
        }
        if (Number(tipoCertificado.value) === 4) {
            payload.es_excelencia = esExcelencia.value
        }
        await api.post('/info-certificados', payload)
        Swal.fire('Éxito', 'Diseño guardado correctamente.', 'success')
    } catch (error) {
        console.error(error)
        Swal.fire('Error', 'No se pudo guardar el diseño.', 'error')
    }
}
</script>

<template>
  <div class="h-screen w-full bg-slate-50 dark:bg-[#0B1120] flex flex-col font-sans overflow-hidden">
    
    <!-- Topbar (Fullscreen Mode) -->
    <header class="h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm relative">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="w-10 h-10 rounded-full bg-slate-50 dark:bg-gray-800 flex items-center justify-center text-slate-500 hover:text-primary-dark dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors shadow-inner border border-slate-200 dark:border-gray-700 hover:border-umsa-blue">
          <span class="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h1 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tight">Workplace del Certificado</h1>
          <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Edición en Lienzo - Evento #{{ eventoId }}</p>
        </div>
      </div>

      <!-- Selector dinámico de Rol y Excelencia (Centro del Topbar) -->
      <div class="hidden md:flex items-center gap-3 bg-slate-50 dark:bg-gray-800 px-4 py-1.5 rounded-2xl border border-slate-200 dark:border-gray-700">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Plantilla:</span>
        <select v-model="tipoCertificado" class="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-750 rounded-lg py-1 px-3 font-bold text-xs text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none cursor-pointer">
            <option :value="1">Logística</option>
            <option :value="2">Expositor</option>
            <option :value="3">Organizador</option>
            <option :value="4">Asistente</option>
        </select>
        
        <div v-if="Number(tipoCertificado) === 4" class="flex gap-1 p-0.5 bg-slate-200 dark:bg-gray-950 rounded-lg border border-slate-350 dark:border-gray-900">
            <button 
                @click.prevent="esExcelencia = 0"
                :class="Number(esExcelencia) === 0 ? 'bg-primary-dark text-white shadow-sm font-black' : 'text-slate-500 hover:bg-slate-300 dark:hover:bg-gray-850 font-bold'"
                class="py-1 px-2.5 rounded-md text-[8px] uppercase tracking-wider transition-all flex items-center gap-1"
            >
                <span class="material-symbols-outlined text-[12px]">military_tech</span>
                Participación
            </button>
            <button 
                @click.prevent="esExcelencia = 1"
                :class="Number(esExcelencia) === 1 ? 'bg-umsa-gold text-white shadow-sm font-black' : 'text-slate-500 hover:bg-slate-300 dark:hover:bg-gray-850 font-bold'"
                class="py-1 px-2.5 rounded-md text-[8px] uppercase tracking-wider transition-all flex items-center gap-1"
            >
                <span class="material-symbols-outlined text-[12px]">workspace_premium</span>
                Excelencia
            </button>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="showPreviewModal = true" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest hover:border-umsa-gold shadow-sm transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[14px]">visibility</span> Previsualizar
        </button>
        <button @click="guardarDiseno" class="px-6 py-2.5 rounded-xl bg-primary-dark text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[14px]">save</span> Guardar Diseño
        </button>
      </div>
    </header>

    <!-- Main Editor Area -->
    <div class="flex flex-1 overflow-hidden">
        
        <!-- Sidebar Izquierdo: Herramientas -->
        <aside class="w-72 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col h-full shrink-0 z-10 shadow-lg">
            <div class="p-6 border-b border-slate-100 dark:border-gray-800">
                <h2 class="text-xs font-black text-umsa-gold uppercase tracking-widest flex items-center gap-2">
                   <span class="material-symbols-outlined text-sm">build</span> Herramientas
                </h2>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                <!-- Seccion 1: Capas/Fondos -->
                <div>
                    <h3 class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3">Imágenes</h3>
                    <div class="space-y-2">
                        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileChange" />
                        <button @click="triggerUpload" class="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-umsa-blue transition-colors group">
                            <div class="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                                <span class="material-symbols-outlined text-slate-400 text-[16px] group-hover:text-umsa-blue transition-colors">image</span>
                            </div>
                            <span class="text-xs font-bold text-primary-dark dark:text-white">Fondo Base</span>
                        </button>
                    </div>
                </div>

                <!-- Seccion 2: Variables Dinámicas -->
                <div>
                    <h3 class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3">Bloques Dinámicos</h3>
                    <div class="space-y-2">
                        <div draggable="true" @dragstart="e => onDragStartPalette(e, 'cabecera', 'Cabecera del Certificado')" class="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:border-blue-500 transition-colors cursor-move group">
                            <span class="material-symbols-outlined text-blue-300 text-[14px]">drag_indicator</span>
                            <span class="text-[10px] font-black text-blue-700 dark:text-blue-300 flex-1 uppercase">Bloque: Cabecera</span>
                            <span class="material-symbols-outlined text-xs text-blue-400">title</span>
                        </div>
                        <div draggable="true" @dragstart="e => onDragStartPalette(e, 'tenor', 'Tenor del Certificado')" class="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:border-blue-500 transition-colors cursor-move group">
                            <span class="material-symbols-outlined text-blue-300 text-[14px]">drag_indicator</span>
                            <span class="text-[10px] font-black text-blue-700 dark:text-blue-300 flex-1 uppercase">Bloque: Tenor</span>
                            <span class="material-symbols-outlined text-xs text-blue-400">notes</span>
                        </div>
                        <div draggable="true" @dragstart="e => onDragStartPalette(e, 'texto', '{NOMBRE_ESTUDIANTE}')" class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-colors cursor-move group mt-4">
                            <span class="material-symbols-outlined text-slate-300 text-[14px]">drag_indicator</span>
                            <span class="text-[10px] font-black font-mono text-primary-dark dark:text-white flex-1">{{ '{' }} NOMBRE_ESTUDIANTE {{ '}' }}</span>
                            <span class="material-symbols-outlined text-xs text-slate-400">person</span>
                        </div>
                        <div draggable="true" @dragstart="e => onDragStartPalette(e, 'texto', '{NOMBRE_CURSO}')" class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-colors cursor-move group">
                            <span class="material-symbols-outlined text-slate-300 text-[14px]">drag_indicator</span>
                            <span class="text-[10px] font-black font-mono text-primary-dark dark:text-white flex-1">{{ '{' }} NOMBRE_CURSO {{ '}' }}</span>
                            <span class="material-symbols-outlined text-xs text-slate-400">school</span>
                        </div>
                        <div draggable="true" @dragstart="e => onDragStartPalette(e, 'texto', '{CODIGO_CERTIFICADO}')" class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-colors cursor-move group">
                            <span class="material-symbols-outlined text-slate-300 text-[14px]">drag_indicator</span>
                            <span class="text-[10px] font-black font-mono text-primary-dark dark:text-white flex-1">{{ '{' }} CODIGO_CERTIFICADO {{ '}' }}</span>
                            <span class="material-symbols-outlined text-xs text-slate-400">123</span>
                        </div>
                    </div>
                </div>

                <!-- Seccion 3: Códigos y Firmas -->
                <div>
                    <h3 class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3">Trazabilidad</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <div draggable="true" @dragstart="e => onDragStartPalette(e, 'qr', 'QR')" class="aspect-square rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-umsa-gold transition-colors flex flex-col items-center justify-center gap-2 cursor-move">
                            <span class="material-symbols-outlined text-[24px] text-slate-400">qr_code_2</span>
                            <span class="text-[9px] font-black uppercase text-slate-500">QR Code</span>
                        </div>
                        <div draggable="true" @dragstart="e => onDragStartPalette(e, 'firma', 'Bloque de Firmas')" class="col-span-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-colors flex items-center justify-center gap-3 cursor-move p-3">
                            <span class="material-symbols-outlined text-[20px] text-slate-400">signature</span>
                            <span class="text-[9px] font-black uppercase text-slate-500 text-center">Bloque de Firmas<br>(Dinámico)</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Canvas Central -->
        <main class="flex-1 bg-slate-100 dark:bg-[#0B1120] relative flex items-center justify-center overflow-auto p-12 relative inner-shadow-workplace">
            
            <!-- Controls Overlay (Zoom, etc) -->
            <div class="absolute bottom-8 right-8 flex gap-2 z-20">
                <button @click="zoomOut" class="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-slate-200 dark:border-gray-700 flex items-center justify-center text-slate-500 hover:text-umsa-blue hover:-translate-y-0.5 transition-all">
                    <span class="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <div class="h-10 px-4 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-slate-200 dark:border-gray-700 flex items-center justify-center text-xs font-black text-primary-dark dark:text-white">
                    {{ Math.round(zoomLevel * 100) }}%
                </div>
                <button @click="zoomIn" class="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-slate-200 dark:border-gray-700 flex items-center justify-center text-slate-500 hover:text-umsa-blue hover:-translate-y-0.5 transition-all">
                    <span class="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
            </div>

            <!-- The Document Canvas -->
            <div class="relative w-full h-full flex justify-center items-start overflow-hidden pt-10">
                <div ref="canvasRef" @dragover.prevent @drop="onDropCanvas" @click.self="deselectElement" class="w-full max-w-[1024px] aspect-[1.414/1] bg-white dark:bg-gray-900 shadow-2xl border border-slate-200 dark:border-gray-800 relative flex items-center justify-center group ring-4 ring-black/5 dark:ring-white/5 bg-cover bg-center overflow-hidden transition-transform duration-200"
                     :style="{ 
                        backgroundImage: infoCertificado?.fondo_url ? `url(${getImageUrl('fondos', infoCertificado.fondo_url)})` : undefined,
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top center'
                     }">
                <!-- Placeholder when empty -->
                <div v-if="!infoCertificado?.fondo_url" class="text-center absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-50 dark:opacity-20">
                    <span class="material-symbols-outlined text-[80px] text-slate-300 dark:text-gray-600 mb-4">aspect_ratio</span>
                    <h3 class="text-2xl font-black text-slate-400 dark:text-gray-500 uppercase tracking-tight">Formato A4 Horizontal</h3>
                    <p class="text-xs text-slate-400 font-bold mt-2 font-mono">1123 x 794 px</p>
                </div>
                
                <!-- Elementos renderizados -->
                <div v-for="el in elementosLienzo" :key="el.id"
                     draggable="true" 
                     @dragstart="e => onDragStartCanvas(e, el.id)"
                     @dragend="onDragEndCanvas"
                     @click.stop="selectElement(el.id)"
                     class="absolute cursor-move flex items-center justify-center group/el border hover:border-blue-500 transition-colors backdrop-blur-[2px]"
                     :class="{ 
                        'border-solid border-umsa-gold ring-2 ring-umsa-gold/30 bg-blue-50/20 dark:bg-white/10': elementoSeleccionado === el.id,
                        'border-dashed border-slate-300 bg-white/40 dark:bg-black/30': elementoSeleccionado !== el.id,
                        'w-auto px-4 py-2 rounded-xl': el.tipo === 'texto',
                        'px-6 py-4 rounded-2xl': el.tipo === 'cabecera' || el.tipo === 'tenor',
                        'h-[120px] rounded-2xl': el.tipo === 'firma',
                        'opacity-30': isDraggingCanvasId === el.id
                     }"
                     :style="{ 
                        left: `${el.x}%`, top: `${el.y}%`, 
                        fontSize: el.tipo !== 'qr' && el.tipo !== 'firma' ? `${el.fontSize}px` : undefined, 
                        color: el.color, fontFamily: el.fontFamily,
                        width: el.width ? `${el.width}px` : 'auto',
                        height: el.height ? `${el.height}px` : 'auto'
                     }">
                    
                    <div v-if="el.tipo === 'texto'" class="flex items-center gap-2">
                        <span class="material-symbols-outlined opacity-50" :style="{ fontSize: `${el.fontSize * 0.8}px` }">tag</span>
                        <span class="font-bold whitespace-nowrap">{{ el.valor }}</span>
                    </div>

                    <div v-if="el.tipo === 'cabecera' || el.tipo === 'tenor'" class="flex flex-col w-full text-center">
                        <span class="text-[10px] uppercase font-black opacity-50 bg-black/5 rounded px-2 py-0.5 inline-block mx-auto mb-2">{{ el.tipo }}</span>
                        <span class="font-bold leading-relaxed break-words whitespace-pre-wrap">{{ el.valor }}</span>
                    </div>

                    <span v-if="el.tipo === 'qr'" class="material-symbols-outlined flex items-center justify-center" :style="{ fontSize: `${el.width || 100}px` }">qr_code_2</span>
                    
                    <div v-if="el.tipo === 'firma'" class="flex flex-col items-center justify-center w-full h-full opacity-60">
                        <div class="flex items-center justify-between w-full px-8 gap-4">
                            <div class="flex flex-col items-center flex-1"><span class="material-symbols-outlined text-[24px] mb-2">draw</span><div class="w-full border-t-2 border-dashed border-current pt-1 text-[8px] font-black uppercase text-center">Firma 1</div></div>
                            <div class="flex flex-col items-center flex-1"><span class="material-symbols-outlined text-[24px] mb-2">draw</span><div class="w-full border-t-2 border-dashed border-current pt-1 text-[8px] font-black uppercase text-center">Firma 2</div></div>
                            <div class="flex flex-col items-center flex-1"><span class="material-symbols-outlined text-[24px] mb-2">draw</span><div class="w-full border-t-2 border-dashed border-current pt-1 text-[8px] font-black uppercase text-center">Firma 3</div></div>
                            <div class="flex flex-col items-center flex-1"><span class="material-symbols-outlined text-[24px] mb-2">draw</span><div class="w-full border-t-2 border-dashed border-current pt-1 text-[8px] font-black uppercase text-center">Firma 4</div></div>
                        </div>
                        <span class="absolute top-2 left-3 text-[10px] uppercase font-black opacity-50 bg-black/5 rounded px-2 py-0.5">Contenedor de Firmas Dinámico</span>
                    </div>

                    <span @click.stop="deleteElement(el.id)" class="material-symbols-outlined text-[12px] absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity z-10 hover:bg-red-600 cursor-pointer shadow-lg">close</span>

                    <!-- Resize Handles -->
                    <template v-if="elementoSeleccionado === el.id">
                        <!-- Right Handle (Width) -->
                        <div v-if="el.tipo !== 'qr'" @mousedown.stop="startResize($event, el, 'width')"
                             class="absolute top-1/2 -right-1.5 w-3 h-8 -translate-y-1/2 bg-white border border-slate-300 dark:bg-gray-700 dark:border-gray-500 rounded-full cursor-ew-resize flex flex-col items-center justify-center gap-[2px] shadow-sm z-20">
                            <div class="w-0.5 h-1 bg-slate-300 dark:bg-gray-400 rounded-full"></div>
                            <div class="w-0.5 h-1 bg-slate-300 dark:bg-gray-400 rounded-full"></div>
                        </div>

                        <!-- Bottom Handle (Height) -->
                        <div v-if="el.tipo !== 'qr'" @mousedown.stop="startResize($event, el, 'height')"
                             class="absolute -bottom-1.5 left-1/2 h-3 w-8 -translate-x-1/2 bg-white border border-slate-300 dark:bg-gray-700 dark:border-gray-500 rounded-full cursor-ns-resize flex items-center justify-center gap-[2px] shadow-sm z-20">
                            <div class="w-1 h-0.5 bg-slate-300 dark:bg-gray-400 rounded-full"></div>
                            <div class="w-1 h-0.5 bg-slate-300 dark:bg-gray-400 rounded-full"></div>
                        </div>

                        <!-- Bottom-Right Corner (Both) -->
                        <div @mousedown.stop="startResize($event, el, 'both')"
                             class="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border border-slate-300 dark:bg-gray-700 dark:border-gray-500 rounded-full cursor-nwse-resize shadow-sm z-20 flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-slate-200 dark:bg-gray-400 rounded-full"></div>
                        </div>
                    </template>
                </div>
            </div>
            </div>
        </main>
        
        <!-- Panel Derecho: Propiedades -->
        <aside class="w-64 bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-gray-800 flex flex-col h-full shrink-0 z-10 shadow-lg">
             <div class="p-6 border-b border-slate-100 dark:border-gray-800">
                <h2 class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest flex items-center gap-2">
                   <span class="material-symbols-outlined text-sm">tune</span> Propiedades
                </h2>
            </div>
            
            <div v-if="!selectedElementData" class="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center opacity-60">
                <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-gray-600 mb-3">touch_app</span>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Selecciona un elemento<br>en el lienzo para editar</p>
            </div>
            
            <div v-else class="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Tipo</label>
                    <p class="text-xs font-bold text-primary-dark dark:text-white bg-slate-50 dark:bg-gray-800 p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 capitalize">{{ selectedElementData.tipo }}</p>
                </div>
                
                <div v-if="selectedElementData.tipo === 'texto'">
                    <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Valor (Variable)</label>
                    <input v-model="selectedElementData.valor" type="text" class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl py-2.5 px-3 font-bold text-xs text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                </div>

                <div v-if="selectedElementData.tipo !== 'qr'">
                    <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Dimensiones (px)</label>
                    <div class="flex gap-2">
                        <div class="flex-1">
                            <span class="text-[9px] text-slate-400 block mb-1 text-center">Ancho</span>
                            <input v-model.number="selectedElementData.width" type="number" min="50" max="1000" class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg py-2 px-2 font-bold text-xs text-primary-dark dark:text-white focus:border-umsa-gold outline-none text-center">
                        </div>
                        <div class="flex-1">
                            <span class="text-[9px] text-slate-400 block mb-1 text-center">Alto</span>
                            <input v-model.number="selectedElementData.height" type="number" min="20" max="1000" class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg py-2 px-2 font-bold text-xs text-primary-dark dark:text-white focus:border-umsa-gold outline-none text-center">
                        </div>
                    </div>
                </div>

                <div>
                    <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Tamaño (px)</label>
                    <input v-model.number="selectedElementData.fontSize" type="number" min="8" max="120" class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl py-2.5 px-3 font-bold text-xs text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                </div>

                <div>
                    <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Color</label>
                    <div class="flex items-center gap-3">
                        <input v-model="selectedElementData.color" type="color" class="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent">
                        <input v-model="selectedElementData.color" type="text" class="flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl py-2.5 px-3 font-mono text-xs text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                    </div>
                </div>
                
                <div>
                    <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Tipografía</label>
                    <select v-model="selectedElementData.fontFamily" class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl py-2.5 px-3 font-bold text-xs text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                    </select>
                </div>
            </div>
        </aside>
    </div>

    <!-- Modal de Previsualización -->
    <div v-if="showPreviewModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-[1080px] p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
            <div class="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
                      <span class="material-symbols-outlined text-umsa-gold text-2xl">workspace_premium</span>
                      Previsualización de Alta Fidelidad
                    </h3>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Simulación real del certificado generado en PDF</p>
                </div>
                <button @click="showPreviewModal = false" class="w-10 h-10 rounded-full bg-slate-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div class="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-100 dark:bg-gray-955 rounded-3xl border border-slate-200 dark:border-gray-800 relative select-none animate-in fade-in duration-300">
                <!-- Certificado Previsualizado (Aspect A4) -->
                <div class="w-full max-w-[960px] aspect-[1.414/1] bg-white shadow-2xl border border-slate-300 relative flex items-center justify-center bg-cover bg-center overflow-hidden rounded-xl"
                     :style="{ 
                        backgroundImage: infoCertificado?.fondo_url ? `url(${getImageUrl('fondos', infoCertificado.fondo_url)})` : undefined,
                     }">
                     
                    <!-- Elementos Dinámicos Sustituidos -->
                    <div v-for="el in elementosLienzo" :key="'prev-' + el.id"
                         class="absolute flex items-center justify-center text-center select-none"
                         :style="{ 
                            left: `${el.x}%`, top: `${el.y}%`, 
                            fontSize: el.tipo !== 'qr' && el.tipo !== 'firma' ? `${el.fontSize * 0.9}px` : undefined, 
                            color: el.color, fontFamily: el.fontFamily,
                            width: el.width ? `${el.width * 0.9}px` : 'auto',
                            height: el.height ? `${el.height * 0.9}px` : 'auto'
                         }">
                         
                         <!-- Si es Cabecera -->
                         <div v-if="el.tipo === 'cabecera'" class="font-black uppercase leading-tight">
                            {{ infoCertificado?.cabecera || '[ CABECERA ]' }}
                         </div>
                         
                         <!-- Si es Tenor -->
                         <div v-else-if="el.tipo === 'tenor'" class="leading-relaxed italic whitespace-pre-line">
                            {{ resolvePreviewTenor(infoCertificado?.tenor) }}
                         </div>
                         
                         <!-- Si es Texto Genérico -->
                         <div v-else-if="el.tipo === 'texto'" class="font-bold leading-normal">
                            {{ resolvePreviewVariables(el.valor) }}
                         </div>
                         
                         <!-- Si es QR -->
                         <div v-else-if="el.tipo === 'qr'" class="w-full h-full border-2 border-slate-900 bg-white flex items-center justify-center rounded-xl p-2 shrink-0">
                            <span class="material-symbols-outlined text-[60px] text-slate-800 select-none">qr_code_2</span>
                         </div>
                         
                         <!-- Si es Firma -->
                         <div v-else-if="el.tipo === 'firma'" class="w-full h-full flex flex-col items-center justify-center p-2 relative shrink-0">
                            <div class="h-10 w-32 border-b border-dashed border-slate-400 mb-1 flex items-center justify-center select-none">
                                <span class="font-serif italic text-slate-400 text-xs select-none font-medium">Firma Autorizada</span>
                            </div>
                            <span class="text-[8px] font-black uppercase text-slate-500 select-none">COORDINADOR GENERAL</span>
                         </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-6 flex justify-end shrink-0">
                <button @click="showPreviewModal = false" class="px-6 py-3 bg-primary-dark hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">
                    Cerrar Vista Previa
                </button>
            </div>
        </div>
    </div>

  </div>
</template>

<style scoped>
.inner-shadow-workplace {
    box-shadow: inset 0 0 100px rgba(0,0,0,0.02);
}
:global(.dark) .inner-shadow-workplace {
    box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
}
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
</style>
