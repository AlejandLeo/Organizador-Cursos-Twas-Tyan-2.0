import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSesionAcademicaDto {
  @ApiProperty({ example: 'Sesión 1: Introducción' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Fundamentos básicos' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 'En línea' })
  @IsNotEmpty()
  @IsString()
  modalidad_sesion: string;

  @ApiProperty({ example: '2025-07-14' })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @IsString()
  hora_inicio: string;

  @ApiProperty({ example: '11:00' })
  @IsNotEmpty()
  @IsString()
  hora_fin: string;

  @ApiProperty({ example: 1, description: 'ID de la Modalidad del Curso' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_curso_modalidad: number;
}
