import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAsistenciaDto {
  @ApiPropertyOptional({ example: '2026-03-21T08:15:00Z', description: 'Fecha y hora del registro de asistencia' })
  @IsOptional()
  @IsString() // actually date string? Usually passed as string or handled by backend.
  fecha_hora_registro?: string;

  @ApiProperty({ example: 'PRESENTE', description: 'Estado de la asistencia (PRESENTE, FALTA, ATRASO)' })
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty({ example: 'uuid-inscripcion-123', description: 'ID de la inscripción del alumno' })
  @IsNotEmpty()
  @IsString()
  id_inscripcion: string;

  @ApiProperty({ example: 'uuid-sesion-123', description: 'ID de la sesión académica' })
  @IsNotEmpty()
  @IsString()
  id_sesion_academica: string;
}
