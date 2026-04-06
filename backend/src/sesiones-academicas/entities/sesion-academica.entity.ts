import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CursoModalidad } from '../../curso-modalidades/entities/curso-modalidad.entity';
import { Asistencia } from '../../asistencias/entities/asistencia.entity';

/**
 * SESIONES_ACADEMICAS — clase individual dentro de una modalidad de curso.
 *
 * Cambio v2:
 * - La FK cambia de id_detalle_actividad_academica → id_curso_modalidad.
 * - Se corrigió el typo "cod_vertificacion" → "cod_verificacion".
 *
 * cod_verificacion: código que el estudiante usa para marcar su asistencia.
 * Puede ser un código QR, alfanumérico o numérico.
 * NestJS genera este código y lo envía al docente para proyectarlo en clase.
 */
@Entity('sesiones_academicas')
export class SesionAcademica {
  @PrimaryGeneratedColumn()
  id_sesion_academica: number;

  @Column({ type: 'date', nullable: true })
  fecha: Date;

  @Column({ type: 'time', nullable: true })
  hora_inicio: string;

  @Column({ type: 'time', nullable: true })
  hora_fin: string;

  /** "Presencial" o "Virtual" */
  @Column({ length: 50, nullable: true })
  modalidad: string;

  @Column({ length: 50, nullable: true })
  aula: string;

  /** Código para marcar asistencia. Generado por NestJS, único por sesión. */
  @Column({ length: 100, nullable: true })
  cod_verificacion: string;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /**
   * La sesión pertenece a una modalidad de curso.
   * Antes apuntaba a DETALLES_ACTIVIDADES_ACADEMICAS.
   * Ahora apunta a CURSO_MODALIDADES.
   */
  @ManyToOne(() => CursoModalidad, (cm) => cm.sesiones)
  @JoinColumn({ name: 'id_curso_modalidad' })
  cursoModalidad: CursoModalidad;

  /** Las asistencias registradas en esta sesión (una por estudiante). */
  @OneToMany(() => Asistencia, (asistencia) => asistencia.sesionAcademica)
  asistencias: Asistencia[];
}
