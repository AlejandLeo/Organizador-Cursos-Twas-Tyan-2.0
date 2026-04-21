import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCursoModalidadDto {
  @ApiProperty({ example: 'Presencial', description: 'Tipo de modalidad (Presencial, Virtual, Híbrido)' })
  @IsNotEmpty()
  @IsString()
  tipo: string;

  @ApiPropertyOptional({ example: 51.0, description: 'Nota mínima para aprobar' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_nota?: number;

  @ApiPropertyOptional({ example: 80, description: 'Porcentaje de asistencia mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  min_asistencia?: number;

  @ApiProperty({ example: 1, description: 'ID de la Actividad Académica a la que pertenece' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_actividad_academica: number;
}
