import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class FiltrarUsuariosDto {
  /** Filtrar por nombre del rol: 'Estudiante', 'Ponente', 'Coordinador', etc. */
  @ApiPropertyOptional({ example: 'Estudiante' })
  @IsOptional()
  @IsString()
  rol?: string;

  /** Búsqueda libre sobre nombres, apellidos o email */
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  /** Si es 'false', incluye usuarios inactivos */
  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  soloActivos?: string;
}
