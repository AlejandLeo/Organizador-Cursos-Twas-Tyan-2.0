import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MailTemplateType {
  WELCOME = 'WELCOME',
  ENROLLMENT = 'ENROLLMENT',
  CERTIFICATE = 'CERTIFICATE',
  GENERAL = 'GENERAL'
}

@Entity('mail_templates')
export class MailTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 255 })
  asunto: string;

  @Column({ type: 'text' })
  cuerpo: string;

  @Column({
    type: 'enum',
    enum: MailTemplateType,
    default: MailTemplateType.GENERAL
  })
  tipo: MailTemplateType;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
