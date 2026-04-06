import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEventoStore = defineStore('eventoGlobal', () => {
  // Mock data plana basada en diseño Single-Entity (Eventos unificados por gestión)
  // Próximamente esto vendrá de tu API NestJS
  const eventosAplanados = ref([
    { id: 1, nombre: 'TYAN Hands-on Schools en Bolivia', gestion: '2023', edicion: '1era Versión' },
    { id: 2, nombre: 'TYAN Hands-on Schools en Bolivia', gestion: '2024', edicion: '2da Versión' },
    { id: 3, nombre: 'TYAN Hands-on Schools en Bolivia', gestion: '2025', edicion: '3ra Versión' },
    { id: 4, nombre: 'Congreso Internacional de Biotecnología', gestion: '2024', edicion: 'Edición Inaugural' }
  ])

  // Estado de las selecciones actuales
  const selectedEventoNombre = ref<string | null>('TYAN Hands-on Schools en Bolivia')
  const selectedEventoId = ref<number | null>(3) // Será el ID representativo de esa gestión

  // Computed properties
  const nombresEventos = computed(() => {
    const names = new Set(eventosAplanados.value.map(e => e.nombre))
    return Array.from(names)
  })

  const versionesDisponibles = computed(() => {
    if (!selectedEventoNombre.value) return []
    return eventosAplanados.value.filter(e => e.nombre === selectedEventoNombre.value)
  })

  // Obtener el objeto completo de la versión actualmente gestionada
  const activeEvento = computed(() => {
    if (!selectedEventoId.value) return null
    return eventosAplanados.value.find(e => e.id === selectedEventoId.value) || null
  })

  // Acciones (Actions)
  const setEventoPorNombre = (nombre: string) => {
    selectedEventoNombre.value = nombre
    const versions = versionesDisponibles.value
    // Por defecto auto-selecciona la última gestión disponible para ese nombre
    selectedEventoId.value = versions.length > 0 ? (versions[versions.length - 1]?.id ?? null) : null
  }

  const setVersion = (id: number) => {
    selectedEventoId.value = id
  }

  return {
    eventosAplanados,
    selectedEventoNombre,
    selectedEventoId,
    nombresEventos,
    versionesDisponibles,
    activeEvento,
    setEventoPorNombre,
    setVersion
  }
})
