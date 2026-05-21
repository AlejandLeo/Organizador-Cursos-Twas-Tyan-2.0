import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('mail_queue')
export class MailQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  destinatario: string;

  @Column({ length: 255 })
  asunto: string;

  @Column({ type: 'text', nullable: true })
  cuerpo: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  template: string | null;

  @Column({ type: 'text', nullable: true })
  context: string | null;

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
