import { IsOptional, IsString, IsDateString, IsInt, IsNotEmpty, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateActividadDto {
  @ApiProperty({ example: 'Curso de Python para Científicos' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Curso' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ example: '2025-07-14' })
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @ApiPropertyOptional({ example: '2025-07-18' })
  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @ApiProperty({ example: 1, description: 'ID del evento al que pertenece' })
  @IsNumber()
  @IsNotEmpty()
  id_evento: number;

  @ApiPropertyOptional({ example: { fields: [] } })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  requisitos?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imagen?: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  horas?: number;
}
