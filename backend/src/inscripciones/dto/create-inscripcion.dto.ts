import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInscripcionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  fecha_registro: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_usuario: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_detalle_actividad_academica: string;
}
