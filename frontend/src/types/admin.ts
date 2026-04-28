export interface Persona {
  id_perfil?: string | number;
  nombres: string;
  primer_apellido: string;
  segundo_apellido?: string;
  documento_identidad?: string;
  celular?: string;
  genero?: number;
  fecha_nacimiento?: string;
  pais_origen?: string;
  pais_residencia?: string;
  fecha_registro?: string;
}

export interface Usuario {
  id: number | string;
  email: string;
  estado?: number;
  persona?: Persona;
  roles?: any[];
  inscripciones?: Inscripcion[];
  imparticiones?: any[]; // Actividades que el ponente dicta
  afiliaciones?: any[];
}

export interface Evento {
  id: number | string;
  nombre?: string;
  descripcion?: string;
  gestion?: string;
  estado?: number;
}

export interface Actividad {
  id: number | string;
  tipo: string;
  nombre: string;
  evento?: Evento;
  inscripciones?: Inscripcion[];
}

export interface Inscripcion {
  id: number;
  id_inscripcion?: number; // Alias por compatibilidad
  fecha_creacion: string;
  nota_principal?: number | null;
  miembro_tyan?: number | boolean;
  razon?: string;
  observacion?: string;
  estado: number; // 0: Pendiente, 1: Aprobado, 2: Rechazado
  usuario?: Usuario;
  actividadAcademica?: Actividad;
  datos_adicionales?: Record<string, string>;
}

export interface Ponente {
  id: number | string;
  id_usuario: number | string;
  titulos: string;
  biografia?: string;
  usuario?: Usuario;
  imparticiones?: any[];
}

export interface Estudiante {
  id: number | string;
  id_usuario: number | string;
  codigo_estudiante?: string;
  usuario?: Usuario;
  inscripciones?: Inscripcion[];
}
