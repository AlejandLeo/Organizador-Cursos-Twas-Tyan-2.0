import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InscripcionModalidad } from '../../inscripcion-modalidades/entities/inscripcion-modalidad.entity';
import { SesionAcademica } from '../../sesiones-academicas/entities/sesion-academica.entity';

/**
 * ASISTENCIAS — registro puntual de presencia en una sesión.
 *
 * Cambio v2:
 * - La FK ya NO apunta a INSCRIPCIONES.
 * - Ahora apunta a INSCRIPCION_MODALIDADES.
 *
 * ¿Por qué el cambio?
 * Porque la asistencia es específica de la modalidad.
 * Un estudiante inscrito en el Curso Python (Presencial) asiste
 * a sesiones del Curso Python Presencial, no a sesiones virtuales.
 *
 * estado: 1 = Presente | 0 = Ausente (útil para marcar tardanzas o justificaciones)
 */
@Entity('asistencias')
export class Asistencia {
  @PrimaryGeneratedColumn()
  id_asistencia: number;

  /** Marca de tiempo exacta en que se registró la asistencia. */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_hora_registro: Date;

  /** 1 = Presente | 0 = Ausente */
  @Column({ type: 'integer', default: 1 })
  estado: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /**
   * La inscripción del estudiante en esta modalidad específica.
   * Antes: → Inscripcion. Ahora: → InscripcionModalidad.
   */
  @ManyToOne(
    () => InscripcionModalidad,
    (im) => im.asistencias,
  )
  @JoinColumn({ name: 'id_inscripcion_modalidad' })
  inscripcionModalidad: InscripcionModalidad;

  @ManyToOne(() => SesionAcademica, (sesion) => sesion.asistencias)
  @JoinColumn({ name: 'id_sesion_academica' })
  sesionAcademica: SesionAcademica;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
