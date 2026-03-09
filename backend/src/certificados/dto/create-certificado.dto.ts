import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCertificadoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  fecha_emision: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_info_certificado: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_actividad_academica: string;
}
