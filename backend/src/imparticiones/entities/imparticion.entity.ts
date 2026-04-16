import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { ActividadAcademica } from '../../actividades-academicas/entities/actividad-academica.entity';
import { Evento } from '../../eventos/entities/evento.entity';

/**
 * IMPARTICIONES — quién imparte qué actividad en qué evento.
 *
 * Cambio v2:
 * - Se agregó id_evento (antes solo tenía id_actividad_academica).
 * - FK cambia de id_detalle_actividad_academica → id_actividad_academica.
 * - Se corrigió el typo "id_ usuario" → "id_usuario".
 *
 * ¿Por qué agregar id_evento si la actividad ya tiene su evento?
 * Porque en el futuro un docente podría impartir la misma actividad
 * en diferentes eventos (reediciones). La FK a evento lo hace explícito.
 */
@Entity('imparticiones')
export class Imparticion {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /** El docente que imparte la actividad. */
  @ManyToOne(() => Usuario, (usuario) => usuario.imparticiones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  /** La actividad académica que imparte. */
  @ManyToOne(() => ActividadAcademica, (act) => act.imparticiones)
  @JoinColumn({ name: 'id_actividad_academica' })
  actividadAcademica: ActividadAcademica;

  /** El evento en el que la imparte. */
  @ManyToOne(() => Evento, (evento) => evento.imparticiones)
  @JoinColumn({ name: 'id_evento' })
  evento: Evento;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
