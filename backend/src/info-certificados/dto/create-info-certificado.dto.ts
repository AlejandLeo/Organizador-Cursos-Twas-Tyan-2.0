import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInfoCertificadoDto {
  @ApiProperty({ example: 1, description: 'ID del Evento' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_evento: number;

  @ApiProperty({ example: 'plantilla-1.pdf' })
  @IsNotEmpty()
  @IsString()
  url_plantilla_certificado: string;

  @ApiPropertyOptional({ example: '{ "x": 100, "y": 200 }' })
  @IsOptional()
  @IsString()
  config_qr?: string;

  @ApiPropertyOptional({ example: '{ "x": 50, "y": 300 }' })
  @IsOptional()
  @IsString()
  config_titular?: string;

  @ApiPropertyOptional({ example: '{ "x": 50, "y": 400 }' })
  @IsOptional()
  @IsString()
  config_organizadores?: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  horas_academicas?: number;
}
