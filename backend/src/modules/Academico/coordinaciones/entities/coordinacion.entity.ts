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
import { Evento } from '../../../Academico/eventos/entities/evento.entity';
import { GradoAdministrativo } from '../../../Usuario/grados-administrativos/entities/grado-administrativo.entity';

/**
 * COORDINACION_EVENTOS — quién coordina qué evento.
 *
 * Cambio v2: la FK cambia de id_version_evento → id_evento.
 *
 * Un usuario puede coordinar múltiples eventos.
 * Un evento puede tener múltiples coordinadores.
 * Esta tabla de unión registra esa relación.
 */
@Entity('coordinacion_eventos')
export class CoordinacionEvento {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  @ManyToOne(() => Usuario, (usuario) => usuario.coordinaciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Evento, (evento) => evento.coordinaciones)
  @JoinColumn({ name: 'id_evento' })
  evento: Evento;

  @Column({ name: 'id_grado_administrativo', nullable: true })
  id_grado_administrativo: number;

  @ManyToOne(() => GradoAdministrativo, (ga) => ga.coordinaciones, { nullable: true })
  @JoinColumn({ name: 'id_grado_administrativo' })
  gradoAdministrativo: GradoAdministrativo;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
