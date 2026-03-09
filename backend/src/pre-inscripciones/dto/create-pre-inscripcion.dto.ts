import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePreInscripcionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  actividad_academica: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  fecha_registro: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  miembro_tyan: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razon: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_version_evento: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_usuario: string;
}
