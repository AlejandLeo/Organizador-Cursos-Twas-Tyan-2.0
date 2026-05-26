import { IsOptional } from 'class-validator';

export class CreateAsistenciaDto {
  @IsOptional()
  estado?: number;
}
