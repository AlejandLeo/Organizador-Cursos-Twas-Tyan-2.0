import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notas')
export class Nota {
  @PrimaryGeneratedColumn('uuid')
  id_nota: string;

  @Column('decimal') // or int, depending on grading system. Decimal is safer.
  nota_principal: number;

  @Column()
  id_inscripcion: string;
}
