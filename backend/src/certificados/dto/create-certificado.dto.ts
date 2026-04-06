import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCertificadoDto {
  @ApiProperty({ example: '2026-03-25', description: 'Fecha de emisión del certificado' })
  @IsNotEmpty()
  @IsDateString()
  fecha_emision: string;

  @ApiProperty({ example: 'EMITIDO', description: 'Estado actual del certificado' })
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty({ example: 'uuid-info-cert-123', description: 'ID de la información base del certificado' })
  @IsNotEmpty()
  @IsString()
  id_info_certificado: string;

  @ApiProperty({ example: 'uuid-actividad-123', description: 'ID de la actividad académica asociada' })
  @IsNotEmpty()
  @IsString()
  id_actividad_academica: string;
}
