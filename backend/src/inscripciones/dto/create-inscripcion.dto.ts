import { IsOptional } from 'class-validator';

export class CreateInscripcionDto {
  @IsOptional()
  miembro_tyan?: number;

  @IsOptional()
  razon?: string;
}
