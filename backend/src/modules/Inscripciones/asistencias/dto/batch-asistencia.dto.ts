import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AsistenciaItemDto {
  @ApiProperty({ example: 1, description: 'ID de la InscripcionModalidad' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_inscripcion_modalidad: number;

  @ApiProperty({ example: 1, description: '1 = Presente, 0 = Ausente' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  estado: number;
}

export class BatchAsistenciaDto {
  @ApiProperty({ example: 1, description: 'ID de la Sesión Académica' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_sesion_academica: number;

  @ApiProperty({ type: [AsistenciaItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsistenciaItemDto)
  asistencias: AsistenciaItemDto[];
}
