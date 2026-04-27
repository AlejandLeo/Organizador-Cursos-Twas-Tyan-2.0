// Enums
export enum EstadoUsuario {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

// Entidades Base
export interface Usuario {
  id: number;
  email: string;
  password?: string;
  estado: number | EstadoUsuario;
  persona?: Persona;
  roles?: Rol[];
  usuariosRoles?: any[];
  afiliaciones?: Afiliacion[];
}

export interface Persona {
  id_perfil: string;
  nombres: string;
  primer_apellido: string;
  segundo_apellido?: string;
  documento_identidad: string;
  genero?: string;
  pais_origen?: string;
  pais_residencia?: string;
  fecha_nacimiento?: string;
  celular?: string;
  fecha_registro: string;
  firma_dig?: string;
  id_usuario: string;
}

export interface Rol {
  id: number;
  nombre_rol: string;
}

// Relaciones
export interface UsuarioRol {
  id_usuario_rol: string;
  estado: string;
  id_usuario: string;
  id_rol: string;
}

export interface InfoCertificado {
    id_info_certificado: string;
    cabecera: string;
    tenor: string;
    id_evento: string;
}

export interface Certificado {
    id_certificado: string;
    codigo_certificado: string;
    path_certificado: string;
    fecha_emision: string;
    tipo: string;
    estado: string;
    id_info_certificado: string;
    id_actividad_academica: string;
    id_usuario: string;
}

export interface Evento {
    id_eventos: string;
    descripcion: string;
    gestion: string;
    ubicacion: string;
    direccion: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: string;
    logo?: string;
}

export interface Afiliacion {
    id_afiliacion: string;
    afiliacion: string;
    tipo_afiliacion: string;
    area_tematica: string;
    disciplina_cientifica: string;
    grado_academico: string;
    id_usuario: string;
}

export interface Inscripcion {
    id_inscripcion: string;
    fecha_registro: string;
    nota_principal: number;
    miembro_tyan: boolean;
    razon: string;
    estado: string;
    id_usuario: string;
    id_actividad_academica: string;
}

export interface InscripcionModalidad {
    id_inscripcion_modalidad: string;
    nota: number;
    num_asistencia: number;
    aprobado: boolean;
    id_inscripcion: string;
    id_curso_modalidad: string;
}

export interface CoordinacionEvento {
    id_coordinacion: string;
    id_usuario: string;
    id_evento: string;
}

export interface Imparticion {
    id_imparticion: string;
    id_usuario: string;
    id_actividad_academica: string;
    id_eventos: string;
}

export interface ActividadAcademica {
    id_actividad_academica: string;
    nombre: string;
    descripcion: string;
    tipo: string;
    fecha_inicio: string;
    fecha_fin: string;
    id_evento: string;
}

export interface SesionAcademica {
    id_sesion_academica: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    modalidad: string;
    aula?: string;
    cod_verificacion?: string;
    id_curso_modalidad: string;
}

export interface Asistencia {
    id_asistencia: string;
    fecha_hora_registro: string;
    estado: string;
    id_inscripcion_modalidad: string;
    id_sesion_academica: string;
}

export interface CursoModalidad {
    id_curso_modalidad: string;
    tipo: string;
    min_nota: number;
    min_asistencia: number;
    id_actividad_academica: string;
}

export interface UsuarioCertificado {
    id_usuario: string;
    id_certificado: string;
    tipo_relacion: string;
    es_beneficiario: boolean;
}

