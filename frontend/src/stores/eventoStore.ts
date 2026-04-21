import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useEventoStore = defineStore('eventoGlobal', () => {

  const eventosAplanados = ref<any[]>([])

  const getEstadoStr = (num: number) => {
      switch(num) {
          case 0: return 'Concluido';
          case 1: return 'Activo';
          case 2: return 'Planificación';
          case 3: return 'Borrador';
          default: return 'No definido';
      }
  }

  const fetchEventosInfo = async () => {
    try {
      const res = await api.get('/eventos');
      // res.data is a list of eventos
      const eventos = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      eventosAplanados.value = eventos.map((ev: any) => ({
        id: ev.id,
        nombre: ev.nombre,
        gestion: ev.gestion,
        version: ev.version || `${ev.gestion}`, // Usar edición real o gestión por defecto
        edicion: ev.version ? `${ev.version}` : `Versión ${ev.gestion}`, 
        estado: ev.estado,
        estadoStr: getEstadoStr(ev.estado)
      }));

      // Seleccionar el primero o activo si no hay nada
      if (eventosAplanados.value.length > 0 && !selectedEventoId.value) {
          const activos = eventosAplanados.value.filter(e => e.estado === 1);
          const obj = activos.length > 0 ? activos[0] : eventosAplanados.value[0];
          selectedEventoNombre.value = obj.nombre;
          selectedEventoId.value = obj.id;
      }
    } catch (error) {
      console.error(error);
    }
  }

  const selectedEventoNombre = ref<string | null>(null);
  const selectedEventoId = ref<number | null>(null);

  const nombresEventos = computed(() => {
    const names = new Set(eventosAplanados.value.map(e => e.nombre))
    return Array.from(names)
  })

  // Obtener nombre dinámico para auth (si no hay auth real en este scope)
  const coordinadorNombre = ref('');

  const versionesDisponibles = computed(() => {
    if (!selectedEventoNombre.value) return []
    return eventosAplanados.value.filter(e => e.nombre === selectedEventoNombre.value)
  })

  const selectedEstado = computed(() => {
    const evt = eventosAplanados.value.find(e => e.id === selectedEventoId.value);
    return evt ? evt.estadoStr : '';
  })


  const activeEvento = computed(() => {
    if (!selectedEventoId.value) return null
    return eventosAplanados.value.find(e => e.id === selectedEventoId.value) || null
  })

  const setEventoPorNombre = (nombre: string) => {
    selectedEventoNombre.value = nombre
    const versions = versionesDisponibles.value
    selectedEventoId.value = versions.length > 0 ? (versions[versions.length - 1]?.id ?? null) : null
  }

  const setVersion = (id: number) => {
    selectedEventoId.value = id
  }

  const setCoordinadorNombre = (name: string) => {
    coordinadorNombre.value = name;
  }

  return {
    eventosAplanados,
    selectedEventoNombre,
    selectedEstado,
    selectedEventoId,
    nombresEventos,
    versionesDisponibles,
    activeEvento,
    coordinadorNombre,
    setEventoPorNombre,
    setVersion,
    fetchEventosInfo,
    setCoordinadorNombre
  }
})
