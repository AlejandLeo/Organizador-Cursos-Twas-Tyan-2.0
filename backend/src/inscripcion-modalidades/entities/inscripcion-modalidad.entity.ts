import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Inscripcion } from '../../inscripciones/entities/inscripcion.entity';
import { CursoModalidad } from '../../curso-modalidades/entities/curso-modalidad.entity';
import { Asistencia } from '../../asistencias/entities/asistencia.entity';

/**
 * INSCRIPCION_MODALIDADES — conecta una inscripción con una modalidad específica.
 *
 * ¿Por qué existe esta tabla intermedia?
 * Un estudiante puede estar inscrito en un curso pero elegir la modalidad
 * Presencial o Virtual. Sus notas y asistencias se registran POR modalidad.
 *
 * Ejemplo:
 *   Inscripcion #1 (Juan → Curso Python)
 *     → InscripcionModalidad #1 (modalidad Presencial: nota 75, asistencias 3/3)
 *
 * El campo `aprobado` se calcula comparando:
 *   nota >= cursoModalidad.min_nota AND num_asistencia >= cursoModalidad.min_asistencia
 */
@Entity('inscripcion_modalidades')
export class InscripcionModalidad {
  @PrimaryGeneratedColumn()
  id_inscripcion_modalidad: number;

  /** Nota obtenida en esta modalidad. NULL hasta que se cargue la calificación. */
  @Column({ type: 'float', nullable: true })
  nota: number;

  /** Cantidad de sesiones a las que asistió el estudiante. */
  @Column({ type: 'integer', default: 0 })
  num_asistencia: number;

  /**
   * 1 = Aprobado, 0 = No aprobado.
   * NestJS calcula este valor comparando nota y num_asistencia
   * contra los mínimos definidos en CURSO_MODALIDADES.
   */
  @Column({ type: 'integer', default: 0 })
  aprobado: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /** La inscripción general del estudiante en el curso. */
  @ManyToOne(() => Inscripcion, (inscripcion) => inscripcion.modalidades)
  @JoinColumn({ name: 'id_inscripcion' })
  inscripcion: Inscripcion;

  /** La modalidad específica (Presencial/Virtual) con sus requisitos. */
  @ManyToOne(() => CursoModalidad, (cm) => cm.inscripcionModalidades)
  @JoinColumn({ name: 'id_curso_modalidad' })
  cursoModalidad: CursoModalidad;

  /** Las asistencias registradas en sesiones de esta modalidad. */
  @OneToMany(() => Asistencia, (asistencia) => asistencia.inscripcionModalidad)
  asistencias: Asistencia[];
}
