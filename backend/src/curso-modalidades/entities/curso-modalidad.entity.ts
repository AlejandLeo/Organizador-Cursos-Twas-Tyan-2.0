import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActividadAcademica } from '../../actividades-academicas/entities/actividad-academica.entity';
import { SesionAcademica } from '../../sesiones-academicas/entities/sesion-academica.entity';
import { InscripcionModalidad } from '../../inscripcion-modalidades/entities/inscripcion-modalidad.entity';

/**
 * CURSO_MODALIDADES — variantes de una actividad académica.
 *
 * Un curso puede dictarse en múltiples modalidades con distintos requisitos.
 * Ejemplo: "Curso de Python"
 *   → Modalidad Presencial: mínimo 80% asistencia, nota ≥ 51
 *   → Modalidad Virtual:    mínimo 70% asistencia, nota ≥ 51
 *
 * ¿Para qué sirve min_nota y min_asistencia?
 * Al finalizar el curso, el servicio compara la nota y asistencia real
 * del estudiante contra estos valores para determinar si aprobó.
 */
@Entity('curso_modalidades')
export class CursoModalidad {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** "Presencial", "Virtual", "Híbrido" */
  @Column({ length: 50, nullable: true })
  tipo: string;

  /** Nota mínima para aprobar. FLOAT permite decimales, ej: 51.0 */
  @Column({ type: 'float', default: 0 })
  min_nota: number;

  /** Porcentaje de asistencia mínimo (0-100) */
  @Column({ type: 'integer', default: 0 })
  min_asistencia: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /** Esta modalidad pertenece a una actividad académica. */
  @ManyToOne(() => ActividadAcademica, (act) => act.modalidades)
  @JoinColumn({ name: 'id_actividad_academica' })
  actividadAcademica: ActividadAcademica;

  /** Una modalidad tiene múltiples sesiones (clases). */
  @OneToMany(() => SesionAcademica, (sesion) => sesion.cursoModalidad)
  sesiones: SesionAcademica[];

  @OneToMany(() => InscripcionModalidad, (im) => im.cursoModalidad)
  inscripcionModalidades: InscripcionModalidad[];

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
