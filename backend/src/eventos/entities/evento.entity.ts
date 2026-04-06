import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActividadAcademica } from '../../actividades-academicas/entities/actividad-academica.entity';
import { CoordinacionEvento } from '../../coordinaciones/entities/coordinacion.entity';
import { InfoCertificado } from '../../info-certificados/entities/info-certificado.entity';
import { Imparticion } from '../../imparticiones/entities/imparticion.entity';

/**
 * EVENTOS — edición concreta de un evento académico.
 *
 * Cambio v2: se eliminó la tabla VERSIONES_EVENTOS.
 * Los campos de versión (ubicacion, estado, fechas) ahora viven aquí.
 * Cada fila en EVENTOS es una instancia completa y autónoma.
 *
 * Ejemplo: "Congreso TWAS-TYAN 2025 — La Paz" es una fila de EVENTOS.
 *
 * estado: 1 = Activo/En curso | 0 = Finalizado
 * logo: UUID para localizar el logo en el servidor (no es una ruta).
 */
@Entity('eventos')
export class Evento {
  /** El SQL usa id_eventos (plural), lo respetamos aquí. */
  @PrimaryGeneratedColumn()
  id_eventos: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  /** Año de gestión, ej: "2025" */
  @Column({ length: 10, nullable: true })
  gestion: string;

  @Column({ length: 255, nullable: true })
  ubicacion: string;

  @Column({ length: 255, nullable: true })
  direccion: string;

  @Column({ type: 'date', nullable: true })
  fecha_inicio: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin: Date;

  /** 1 = Activo | 0 = Finalizado */
  @Column({ type: 'integer', default: 1 })
  estado: number;

  /** UUID para localizar el archivo de logo en el servidor. */
  @Column({ length: 255, nullable: true })
  logo: string;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /** Un evento tiene múltiples actividades (cursos, talleres, conferencias). */
  @OneToMany(() => ActividadAcademica, (act) => act.evento)
  actividades: ActividadAcademica[];

  /** Usuarios que coordinan este evento. */
  @OneToMany(() => CoordinacionEvento, (ce) => ce.evento)
  coordinaciones: CoordinacionEvento[];

  /** Plantillas de certificado para este evento. */
  @OneToMany(() => InfoCertificado, (ic) => ic.evento)
  infosCertificados: InfoCertificado[];

  @OneToMany(() => Imparticion, (imp) => imp.evento)
  imparticiones: Imparticion[];

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
