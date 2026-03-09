import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetalleActividadAcademicaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tipo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  min_nota: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  min_asistencia: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_actividad_academica: string;
}
