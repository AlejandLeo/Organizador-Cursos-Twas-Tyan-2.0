import { defineStore } from 'pinia';

interface RegistroHistorial {
  id: string;
  modulo: 'evento' | 'actividad' | 'usuario' | 'certificado';
  accion: 'crear' | 'editar' | 'eliminar';
  descripcion: string;
  usuario: string;
  timestamp: string;
  entidadId?: string;
  entidadNombre?: string;
  leido: boolean;
  // NUEVO: Para la comparación de datos
  cambios?: {
    campo: string;
    antes: any;
    despues: any;
  }[];
  metadatos?: any;
}

export const useAdminHistorialStore = defineStore('adminHistorial', {
  state: () => ({
    registros: JSON.parse(localStorage.getItem('admin_historial') || '[]') as RegistroHistorial[],
  }),

  getters: {
    totalPendientes: (state) => state.registros.filter(r => !r.leido).length,
    porModulo: (state) => {
      return state.registros.reduce((acc, r) => {
        acc[r.modulo] = (acc[r.modulo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  },

  actions: {
    registrar(
      modulo: RegistroHistorial['modulo'],
      accion: RegistroHistorial['accion'],
      descripcion: string,
      extra?: { entidadId?: string; entidadNombre?: string; cambios?: RegistroHistorial['cambios']; metadatos?: any }
    ) {
      const nuevo: RegistroHistorial = {
        id: crypto.randomUUID(),
        modulo,
        accion,
        descripcion,
        usuario: 'Super Administrador', // Esto vendrá del AuthStore en el futuro
        timestamp: new Date().toISOString(),
        leido: false,
        ...extra
      };

      this.registros.unshift(nuevo);
      this.persistir();
    },

    marcarLeido(id: string) {
      const reg = this.registros.find(r => r.id === id);
      if (reg) {
        reg.leido = true;
        this.persistir();
      }
    },

    marcarTodosLeidos() {
      this.registros.forEach(r => r.leido = true);
      this.persistir();
    },

    eliminarRegistro(id: string) {
      this.registros = this.registros.filter(r => r.id !== id);
      this.persistir();
    },

    limpiarTodo() {
      this.registros = [];
      localStorage.removeItem('admin_historial');
    },

    persistir() {
      localStorage.setItem('admin_historial', JSON.stringify(this.registros));
    }
  }
});
