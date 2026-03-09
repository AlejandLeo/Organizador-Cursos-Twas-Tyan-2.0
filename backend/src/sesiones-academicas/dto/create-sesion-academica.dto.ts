import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSesionAcademicaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  hora_inicio: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  hora_fin: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  modalidad: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  aula: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cod_verificacion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_detalle_actividad_academica: string;
}
