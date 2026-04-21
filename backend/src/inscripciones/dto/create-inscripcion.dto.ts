import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInscripcionDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_usuario: number;

  @ApiProperty({ example: 1, description: 'ID de la actividad académica' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_actividad_academica: number;

  @ApiPropertyOptional({ example: 1, description: 'Si es miembro de TYAN (1 o 0)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  miembro_tyan?: number;

  @ApiPropertyOptional({ example: 'Motivación para inscribirse' })
  @IsOptional()
  @IsString()
  razon?: string;

  @ApiPropertyOptional({ example: 1, description: 'Estado: 1 activo, 0 cancelado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado?: number;
}
