import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../../Usuario/usuarios/entities/usuario.entity';

@Entity('solicitudes_soporte')
export class SolicitudSoporte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  tipo: string; // 'password', 'datos', 'otro'

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ name: 'id_usuario', nullable: true })
  id_usuario: number | null;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ type: 'int', default: 0 })
  estado: number; // 0: Pendiente, 1: Resuelto

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;
}
