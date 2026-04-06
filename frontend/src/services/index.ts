// Exportar api base
export { default as api } from './api';

// Exportar servicios individuales
export * from './auth.service';

// Tablas Independientes
export * from './usuarios.service';
export * from './perfiles.service';
export * from './roles.service';
export * from './usuarios-roles.service';
export * from './firmas.service';
export * from './posteos.service';

// Eventos
export * from './eventos.service';
export * from './versiones-eventos.service';
export * from './coordinaciones.service';

// Académico
export * from './actividades-academicas.service';
export * from './detalles-actividades.service';
export * from './sesiones-academicas.service';
export * from './imparticiones.service';
export * from './asistencias.service';
export * from './notas.service';
export * from './detalles-notas.service';

// Inscripciones
export * from './pre-inscripciones.service';
export * from './inscripciones.service';

// Certificados
export * from './info-certificados.service';
export * from './certificados.service';
