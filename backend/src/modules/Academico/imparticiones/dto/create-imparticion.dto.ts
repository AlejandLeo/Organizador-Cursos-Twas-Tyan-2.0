import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateImparticionDto {
  @ApiProperty({ example: 1, description: 'ID del ponente (Usuario)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_usuario: number;

  @ApiProperty({ example: 1, description: 'ID de la actividad académica' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_actividad_academica: number;

  @ApiProperty({ example: 1, description: 'ID del evento' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_evento: number;

  @ApiPropertyOptional({ example: 'Avances en inteligencia artificial aplicada', description: 'Temática o título de la presentación' })
  @IsOptional()
  @IsString()
  tematica?: string;
}
