import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sistema_configuracion')
export class ConfiguracionSistema {
  @PrimaryColumn({ length: 100 })
  clave: string;

  @Column({ type: 'text' })
  valor: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
