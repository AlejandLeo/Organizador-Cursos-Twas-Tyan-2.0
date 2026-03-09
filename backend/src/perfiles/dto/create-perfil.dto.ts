import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePerfilDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nombres: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  primer_apellido: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  segundo_apellido?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  documento_identidad: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  genero: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  pais_origen: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  pais_residencia: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  fecha_nacimiento: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  celular: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  afiliacion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tipo_afiliacion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  area_tematica: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  disciplina_cientifica: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  grado_academico: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_usuario: string;
}
