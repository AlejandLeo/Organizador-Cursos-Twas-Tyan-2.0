import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('certificados')
export class Certificado {
  @PrimaryGeneratedColumn('uuid')
  id_certificado: string;

  @Column({ type: 'date' })
  fecha_emision: Date;

  @Column()
  estado: string;

  @Column()
  id_info_certificado: string;

  @Column()
  id_actividad_academica: string;
}
