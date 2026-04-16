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
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { ActividadAcademica } from '../../actividades-academicas/entities/actividad-academica.entity';
import { InscripcionModalidad } from '../../inscripcion-modalidades/entities/inscripcion-modalidad.entity';

/**
 * INSCRIPCIONES — registro de un usuario en una actividad académica.
 *
 * Cambio v2:
 * - Se agregaron: nota_principal, miembro_tyan, razon.
 * - FK cambia de id_detalle_actividad_academica → id_actividad_academica.
 * - Se eliminó la relación con NOTAS (nota_principal vive aquí).
 *
 * nota_principal: nota global del curso (resumen de todas las modalidades).
 * miembro_tyan: 1 si el estudiante es miembro de la red TYAN.
 * razon: por qué el estudiante quiere tomar este curso (puede usarse para selección).
 */
@Entity('inscripciones')
export class Inscripcion {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;

  /**
   * Nota final global del curso. NULL hasta que el docente la cargue.
   * FLOAT permite decimales: 85.5, 61.0, etc.
   */
  @Column({ type: 'float', nullable: true })
  nota_principal: number;

  /** 1 = Es miembro de la red TYAN | 0 = No es miembro */
  @Column({ type: 'integer', default: 0 })
  miembro_tyan: number;

  /** Motivación del estudiante para inscribirse. */
  @Column({ type: 'text', nullable: true })
  razon: string;

  /** 1 = Activa | 0 = Cancelada */
  @Column({ type: 'integer', default: 1 })
  estado: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /** El usuario que se inscribió. */
  @ManyToOne(() => Usuario, (usuario) => usuario.inscripciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  /**
   * La actividad en la que se inscribió.
   * Antes apuntaba a DETALLES_ACTIVIDADES, ahora apunta directo a ACTIVIDADES.
   */
  @ManyToOne(() => ActividadAcademica, (act) => act.inscripciones)
  @JoinColumn({ name: 'id_actividad_academica' })
  actividadAcademica: ActividadAcademica;

  /**
   * Las modalidades específicas en las que participó (Presencial, Virtual...).
   * Los detalles de nota y asistencia POR modalidad viven en InscripcionModalidad.
   */
  @OneToMany(() => InscripcionModalidad, (im) => im.inscripcion)
  modalidades: InscripcionModalidad[];
}
