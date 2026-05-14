import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('mail_logs')
export class MailLog {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ length: 255 })
  destinatario: string;

  @Column({ length: 255 })
  asunto: string;

  @Column({ length: 100, nullable: true })
  template?: string;

  @Column({ type: 'text', nullable: true })
  contexto?: string; // Guardaremos el JSON string del contexto

  /** pendiente | enviado | fallido */
  @Column({ length: 20, default: 'pendiente' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ length: 255, nullable: true })
  message_id?: string;


  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_envio: Date;
}
