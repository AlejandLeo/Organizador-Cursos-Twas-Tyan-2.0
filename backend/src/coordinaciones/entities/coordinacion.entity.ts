import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Evento } from '../../eventos/entities/evento.entity';

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
  @PrimaryGeneratedColumn()
  id_coordinacion: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  @ManyToOne(() => Usuario, (usuario) => usuario.coordinaciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Evento, (evento) => evento.coordinaciones)
  @JoinColumn({ name: 'id_evento' })
  evento: Evento;
}
