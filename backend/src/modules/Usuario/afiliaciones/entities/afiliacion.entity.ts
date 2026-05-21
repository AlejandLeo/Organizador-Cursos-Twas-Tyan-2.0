import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../../Usuario/usuarios/entities/usuario.entity';
import { GradoAcademico } from '../../../Usuario/grados-academicos/entities/grado-academico.entity';
import { GradoAdministrativo } from '../../../Usuario/grados-administrativos/entities/grado-administrativo.entity';

/**
 * AFILIACIONES — datos institucionales/académicos del usuario.
 */
@Entity('afiliaciones')
export class Afiliacion {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** Nombre de la institución, ej: "Universidad Mayor de San Andrés" */
  @Column({ name: 'afiliacion', length: 255, nullable: true })
  institucion: string;

  /** Tipo de institución: "Universidad", "Centro de Investigación", etc. */
  @Column({ length: 100, nullable: true })
  tipo_afiliacion: string;

  /** Campo temático principal, ej: "Ciencias Exactas", "Ciencias de la Vida" */
  @Column({ length: 500, nullable: true })
  area_tematica: string;

  /** Disciplina específica, ej: "Informática", "Biología Molecular" */
  @Column({ length: 500, nullable: true })
  disciplina_cientifica: string;

  // ── Relación ─────────────────────────────────────────────────────────────

  /** Sustiuye al antiguo campo de texto por una relación formal */
  @Column({ name: 'id_grado_academico', nullable: true })
  id_grado_academico: number;

  @ManyToOne(() => GradoAcademico, (ga) => ga.afiliaciones, { nullable: true })
  @JoinColumn({ name: 'id_grado_academico' })
  gradoAcademico: GradoAcademico;

  @Column({ name: 'id_grado_administrativo', nullable: true })
  id_grado_administrativo: number;

  @ManyToOne(() => GradoAdministrativo, { nullable: true })
  @JoinColumn({ name: 'id_grado_administrativo' })
  gradoAdministrativo: GradoAdministrativo;

  /** Muchas afiliaciones pueden pertenecer al mismo usuario. */
  @ManyToOne(() => Usuario, (usuario) => usuario.afiliaciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
