import { IsOptional, IsString, IsDateString, IsInt, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

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
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? value : parsed;
  })
  @IsNumber()
  @IsNotEmpty()
  id_evento: number;

  @ApiPropertyOptional({ example: { fields: [] } })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return undefined;
      }
    }
    return value;
  })
  requisitos?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imagen?: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? value : parsed;
  })
  @Type(() => Number)
  @IsInt()
  horas?: number;

  @ApiPropertyOptional({ example: 'Presencial' })
  @IsOptional()
  @IsString()
  modalidad?: string;

  @ApiPropertyOptional({ example: 71 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') return undefined;
    return parseFloat(value);
  })
  @IsNumber()
  min_nota?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  min_asistencia?: number;

  @ApiPropertyOptional({ type: 'string', description: 'JSON string de sesiones' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') return undefined;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch (e) { return value; }
    }
    return value;
  })
  sesiones?: any[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') return undefined;
    return parseInt(value, 10);
  })
  @IsInt()
  estado?: number;

  @ApiPropertyOptional({ type: 'string', description: 'JSON string de materiales' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') return undefined;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch (e) { return value; }
    }
    return value;
  })
  materiales?: any;

  @ApiPropertyOptional({ type: 'string', description: 'JSON string de IDs de personal de logística' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'undefined' || value === 'null' || value === '') return undefined;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(id => Number(id)) : [];
      } catch (e) {
        return value;
      }
    }
    return Array.isArray(value) ? value.map(id => Number(id)) : value;
  })
  logistica_ids?: number[];
}
