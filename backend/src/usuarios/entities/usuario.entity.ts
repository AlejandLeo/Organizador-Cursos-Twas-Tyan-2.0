import {Column, CreateDateColumn,Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,} from 'typeorm';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id_usuario: string;

  @Column({ unique: true })
  ci: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nombres: string;

  @Column()
  paterno: string;

  @Column({ nullable: true })
  materno: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ type: 'date', nullable: true })
  fec_naci: string | null;

  @Column({ nullable: true })
  genero: string;

  @Column({ nullable: true, default: 'image/Usuarios/default-user.png' })
  imagen: string;



  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
