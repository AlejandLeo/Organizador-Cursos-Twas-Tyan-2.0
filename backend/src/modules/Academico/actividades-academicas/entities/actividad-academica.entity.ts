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
import { Evento } from '../../../Academico/eventos/entities/evento.entity';
import { CursoModalidad } from '../../../Academico/curso-modalidades/entities/curso-modalidad.entity';
import { Inscripcion } from '../../../Inscripciones/inscripciones/entities/inscripcion.entity';
import { Certificado } from '../../../Certificacion/certificados/entities/certificado.entity';
import { Imparticion } from '../../../Academico/imparticiones/entities/imparticion.entity';

/**
 * ACTIVIDADES_ACADEMICAS — curso, taller o conferencia dentro de un evento.
 *
 * Cambio v2:
 * - Se agregó descripcion.
 * - La FK cambia de id_version_evento → id_evento (eliminamos VERSIONES_EVENTOS).
 *
 * Una actividad puede tener múltiples modalidades (CURSO_MODALIDADES)
 * y múltiples inscripciones de estudiantes.
 */
@Entity('actividades_academicas')
export class ActividadAcademica {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  /** "Curso", "Taller", "Conferencia", "Workshop" */
  @Column({ length: 50, nullable: true })
  tipo: string;

  @Column({ type: 'date', nullable: true })
  fecha_inicio: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin: Date;

  @Column({ length: 255, nullable: true })
  imagen: string;

  @Column({ type: 'integer', nullable: true })
  horas: number;

  /** 
   * Requisitos configurados para la pre-inscripción (Base + Dinámicos).
   * Almacenado como JSON.
   */
  @Column({ type: 'jsonb', nullable: true })
  requisitos: any;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /** La actividad pertenece a un evento. */
  @ManyToOne(() => Evento, (evento) => evento.actividades)
  @JoinColumn({ name: 'id_evento' })
  evento: Evento;

  /** Las modalidades disponibles para esta actividad. */
  @OneToMany(() => CursoModalidad, (cm) => cm.actividadAcademica)
  modalidades: CursoModalidad[];

  /** Los estudiantes inscritos en esta actividad. */
  @OneToMany(() => Inscripcion, (ins) => ins.actividadAcademica)
  inscripciones: Inscripcion[];

  /** Los certificados generados por esta actividad. */
  @OneToMany(() => Certificado, (cert) => cert.actividadAcademica)
  certificados: Certificado[];

  @OneToMany(() => Imparticion, (imp) => imp.actividadAcademica)
  imparticiones: Imparticion[];

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
