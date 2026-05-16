import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('mail_queue')
export class MailQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  destinatario: string;

  @Column({ length: 255 })
  asunto: string;

  @Column({ type: 'text' })
  cuerpo: string;

  /** PENDING, SENT, FAILED, PAUSED_QUOTA */
  @Column({ length: 20, default: 'PENDING' })
  estado: string;

  @Column({ type: 'integer', default: 0 })
  intentos: number;

  @Column({ type: 'text', nullable: true })
  ultimo_error: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fecha_envio: Date;
}
