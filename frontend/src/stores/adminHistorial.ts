import { defineStore } from 'pinia';
import api from '@/services/api';

interface RegistroHistorial {
  id: number;
  modulo: 'evento' | 'actividad' | 'usuario' | 'certificado';
  accion: 'crear' | 'editar' | 'eliminar';
  descripcion: string;
  usuario: string;
  entidad_id?: string;
  entidad_nombre?: string;
  cambios?: { campo: string; antes: any; despues: any }[];
  metadatos?: any;
  fecha_creacion: string;
}

interface PaginatedResponse {
  data: RegistroHistorial[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useAdminHistorialStore = defineStore('adminHistorial', {
  state: () => ({
    registros: [] as RegistroHistorial[],
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 0,
    loading: false,
    // Mantenemos compatibilidad con el badge del sidebar
    _pendientes: 0,
  }),

  getters: {
    totalPendientes: (state) => state._pendientes,
  },

  actions: {
    /**
     * Registrar una acción en la bitácora (envía al backend).
     */
    async registrar(
      modulo: RegistroHistorial['modulo'],
      accion: RegistroHistorial['accion'],
      descripcion: string,
      extra?: {
        entidadId?: string;
        entidadNombre?: string;
        cambios?: RegistroHistorial['cambios'];
        metadatos?: any;
      },
    ) {
      try {
        await api.post('/audit-log', {
          modulo,
          accion,
          descripcion,
          usuario: 'Super Administrador',
          entidad_id: extra?.entidadId,
          entidad_nombre: extra?.entidadNombre,
          cambios: extra?.cambios,
          metadatos: extra?.metadatos,
        });
        this._pendientes++;
      } catch (e) {
        console.error('Error registrando en bitácora:', e);
      }
    },

    /**
     * Cargar registros paginados con filtros.
     */
    async cargar(filtros?: {
      page?: number;
      limit?: number;
      modulo?: string;
      accion?: string;
      busqueda?: string;
      fechaDesde?: string;
      fechaHasta?: string;
    }) {
      this.loading = true;
      try {
        const params = new URLSearchParams();
        if (filtros?.page) params.set('page', String(filtros.page));
        if (filtros?.limit) params.set('limit', String(filtros.limit));
        if (filtros?.modulo) params.set('modulo', filtros.modulo);
        if (filtros?.accion) params.set('accion', filtros.accion);
        if (filtros?.busqueda) params.set('busqueda', filtros.busqueda);
        if (filtros?.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
        if (filtros?.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);

        const res = await api.get(`/audit-log?${params.toString()}`);
        const data = res.data as PaginatedResponse;

        this.registros = data.data;
        this.total = data.total;
        this.page = data.page;
        this.limit = data.limit;
        this.totalPages = data.totalPages;
      } catch (e) {
        console.error('Error cargando historial:', e);
        this.registros = [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * Obtener todos los registros filtrados para exportación.
     */
    async exportar(filtros?: {
      modulo?: string;
      accion?: string;
      busqueda?: string;
      fechaDesde?: string;
      fechaHasta?: string;
    }): Promise<RegistroHistorial[]> {
      try {
        const params = new URLSearchParams();
        if (filtros?.modulo) params.set('modulo', filtros.modulo);
        if (filtros?.accion) params.set('accion', filtros.accion);
        if (filtros?.busqueda) params.set('busqueda', filtros.busqueda);
        if (filtros?.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
        if (filtros?.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);

        const res = await api.get(`/audit-log/exportar?${params.toString()}`);
        return res.data as RegistroHistorial[];
      } catch (e) {
        console.error('Error exportando historial:', e);
        return [];
      }
    },

    async eliminarRegistro(id: number) {
      try {
        await api.delete(`/audit-log/${id}`);
        this.registros = this.registros.filter((r) => r.id !== id);
        this.total--;
      } catch (e) {
        console.error('Error eliminando registro:', e);
      }
    },

    async limpiarTodo() {
      try {
        await api.delete('/audit-log');
        this.registros = [];
        this.total = 0;
        this._pendientes = 0;
      } catch (e) {
        console.error('Error limpiando bitácora:', e);
      }
    },

    marcarTodosLeidos() {
      this._pendientes = 0;
    },
  },
});
