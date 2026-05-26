import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInfoCertificadoDto {
  @ApiProperty({ example: 1, description: 'ID del Evento' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_evento: number;

  @ApiPropertyOptional({ example: 'Certificado de Asistencia' })
  @IsOptional()
  @IsString()
  cabecera?: string;

  @ApiPropertyOptional({ example: 'Se certifica que [NOMBRE] asistió a...' })
  @IsOptional()
  @IsString()
  tenor?: string;

  @ApiPropertyOptional({ example: 'fondo.jpg' })
  @IsOptional()
  @IsString()
  fondo_url?: string;

  @ApiPropertyOptional({ example: 1, description: 'Tipo de rol (1: Asistente, etc.)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tipo?: number;

  @ApiPropertyOptional({ example: 0, description: 'Indicador de Excelencia (0: Participación, 1: Excelencia)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  es_excelencia?: number;

  @ApiPropertyOptional({ description: 'JSON con configuracion visual' })
  @IsOptional()
  configuracion?: any;
}
