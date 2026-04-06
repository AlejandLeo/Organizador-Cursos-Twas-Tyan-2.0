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
import { Evento } from '../../eventos/entities/evento.entity';
import { CursoModalidad } from '../../curso-modalidades/entities/curso-modalidad.entity';
import { Inscripcion } from '../../inscripciones/entities/inscripcion.entity';
import { Certificado } from '../../certificados/entities/certificado.entity';
import { Imparticion } from '../../imparticiones/entities/imparticion.entity';

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
  @PrimaryGeneratedColumn()
  id_actividad_academica: number;

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
