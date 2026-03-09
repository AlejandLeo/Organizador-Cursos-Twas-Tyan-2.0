import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('perfiles')
export class Perfil {
  @PrimaryGeneratedColumn('uuid')
  id_perfil: string;

  @Column()
  nombres: string;

  @Column()
  primer_apellido: string;

  @Column({ nullable: true })
  segundo_apellido: string;

  @Column()
  documento_identidad: string;

  @Column()
  genero: string;

  @Column()
  pais_origen: string;

  @Column()
  pais_residencia: string;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;

  @Column()
  celular: string;

  @Column()
  afiliacion: string;

  @Column()
  tipo_afiliacion: string;

  @Column()
  area_tematica: string;

  @Column()
  disciplina_cientifica: string;

  @Column()
  grado_academico: string;

  @Column()
  id_usuario: string;
}
