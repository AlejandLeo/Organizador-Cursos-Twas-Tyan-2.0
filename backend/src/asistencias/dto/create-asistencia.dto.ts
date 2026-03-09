import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAsistenciaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString() // actually date string? Usually passed as string or handled by backend.
  fecha_hora_registro?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_inscripcion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_sesion_academica: string;
}
