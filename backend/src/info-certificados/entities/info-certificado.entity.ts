import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('info_certificados')
export class InfoCertificado {
  @PrimaryGeneratedColumn('uuid')
  id_info_certificado: string;

  @Column()
  cabecera: string;

  @Column()
  tenor: string;

  @Column()
  id_version_evento: string;
}
