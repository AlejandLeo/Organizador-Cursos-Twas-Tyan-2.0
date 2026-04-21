// Exportar api base
export { default as api } from './api';

// Exportar servicios individuales
export * from './auth.service';

// Tablas Independientes
export * from './usuarios.service';
export * from './roles.service';
export * from './usuarios-roles.service';

// Eventos
export * from './eventos.service';

// Académico
export * from './actividades-academicas.service';
export * from './curso-modalidad.service';
export * from './sesiones-academicas.service';
export * from './imparticiones.service';
export * from './asistencias.service';

// Inscripciones
export * from './inscripciones.service';
export * from './inscripcion-modalidades.service';

// Certificados
export * from './info-certificados.service';
export * from './certificados.service';
export * from './usuarios-certificados.service';
