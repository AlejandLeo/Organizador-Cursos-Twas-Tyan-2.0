// Enums
export enum EstadoUsuario {
  ACTIVO = 1,
  INACTIVO = 0,
}

// Entidades Base
export interface Usuario {
  id: number;
  email: string;
  password?: string;
  estado: number;
  persona?: Persona;
  roles?: Rol[];
  usuariosRoles?: any[];
  afiliaciones?: Afiliacion[];
  requiere_cambio_password?: boolean;
}

export interface Persona {
  id: number;
  nombres: string;
  primer_apellido: string;
  segundo_apellido?: string;
  documento_identidad: string;
  genero?: number;
  pais_origen?: string;
  pais_residencia?: string;
  fecha_nacimiento?: string;
  celular?: string;
  fecha_creacion?: string;
  firma_dig?: string;
  perfil_completado?: boolean;
  ponente_configurado?: boolean;
  id_usuario: number;
}

export interface Rol {
  id: number;
  nombre_rol: string;
}

// Relaciones
export interface UsuarioRol {
  id: number;
  estado: number;
  id_usuario: number;
  id_rol: number;
}

export interface InfoCertificado {
  id: number;
  cabecera: string;
  tenor: string;
  id_evento: number;
}

export interface Certificado {
  id: number;
  codigo_certificado: string;
  path_certificado: string;
  fecha_emision: string;
  tipo: string;
  estado: number;
  id_info_certificado: number;
  id_actividad_academica: number;
  id_usuario: number;
  estado_envio?: string;
  fecha_ultimo_envio?: string | null;
  log_error_envio?: string | null;
  reintentos?: number;
  actividadAcademica?: any;
  usuario?: any;
}

export interface Evento {
  id: number;
  nombre_evento?: string;
  sigla?: string;
  descripcion: string;
  gestion: string;
  ubicacion: string;
  direccion: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: number;
  logo?: string;
}

export interface Afiliacion {
  id: number;
  institucion: string;
  tipo_afiliacion: string;
  area_tematica: string;
  disciplina_cientifica: string;
  id_grado_academico?: number;
  id_usuario: number;
}

export interface Inscripcion {
  id: number;
  fecha_registro: string;
  nota_principal: number;
  miembro_tyan: boolean;
  razon: string;
  estado: number;
  id_usuario: number;
  id_actividad_academica: number;
}

export interface InscripcionModalidad {
  id: number;
  nota: number;
  num_asistencia: number;
  aprobado: boolean;
  id_inscripcion: number;
  id_curso_modalidad: number;
}

export interface CoordinacionEvento {
  id: number;
  id_usuario: number;
  id_evento: number;
}

export interface Imparticion {
  id: number;
  id_usuario: number;
  id_actividad_academica: number;
  id_evento: number;
}

export interface ActividadAcademica {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  id_evento: number;
}

export interface SesionAcademica {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  modalidad: string;
  aula?: string;
  cod_verificacion?: string;
  id_actividad_academica: number;
}

export interface Asistencia {
  id: number;
  fecha_hora_registro: string;
  estado: number;
  id_inscripcion: number;
  id_sesion_academica: number;
}

export interface CursoModalidad {
  id: number;
  tipo: string;
  min_nota: number;
  min_asistencia: number;
  id_actividad_academica: number;
}

export interface UsuarioCertificado {
  id_usuario: number;
  id_certificado: number;
  tipo_relacion: string;
  es_beneficiario: boolean;
}
