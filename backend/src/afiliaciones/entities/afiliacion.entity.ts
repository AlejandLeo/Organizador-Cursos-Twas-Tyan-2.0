import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

/**
 * AFILIACIONES — datos institucionales/académicos del usuario.
 *
 * ¿Por qué una tabla separada y no en PERSONAS?
 * Porque un usuario puede tener *múltiples* afiliaciones.
 * Ejemplo: un investigador que trabaja en dos universidades al mismo tiempo.
 * Si los datos de afiliación estuvieran en PERSONAS, solo podría tener una.
 *
 * Relación ManyToOne: muchas afiliaciones → un usuario.
 */
@Entity('afiliaciones')
export class Afiliacion {
  @PrimaryGeneratedColumn()
  id_afiliacion: number;

  /** Nombre de la institución, ej: "Universidad Mayor de San Andrés" */
  @Column({ length: 255, nullable: true })
  afiliacion: string;

  /** Tipo de institución: "Universidad", "Centro de Investigación", etc. */
  @Column({ length: 100, nullable: true })
  tipo_afiliacion: string;

  /** Campo temático principal, ej: "Ciencias Exactas", "Ciencias de la Vida" */
  @Column({ length: 100, nullable: true })
  area_tematica: string;

  /** Disciplina específica, ej: "Informática", "Biología Molecular" */
  @Column({ length: 100, nullable: true })
  disciplina_cientifica: string;

  /** Nivel académico, ej: "Licenciatura", "Maestría", "Doctorado" */
  @Column({ length: 100, nullable: true })
  grado_academico: string;

  // ── Relación ─────────────────────────────────────────────────────────────

  /** Muchas afiliaciones pueden pertenecer al mismo usuario. */
  @ManyToOne(() => Usuario, (usuario) => usuario.afiliaciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}
