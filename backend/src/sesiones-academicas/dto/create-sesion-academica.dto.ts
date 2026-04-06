import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSesionAcademicaDto {
  @ApiProperty({ example: '2026-03-21', description: 'Fecha de la sesión' })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio' })
  @IsNotEmpty()
  @IsString()
  hora_inicio: string;

  @ApiProperty({ example: '12:00', description: 'Hora de finalización' })
  @IsNotEmpty()
  @IsString()
  hora_fin: string;

  @ApiProperty({ example: 'PRESENCIAL', description: 'Modalidad de la sesión' })
  @IsNotEmpty()
  @IsString()
  modalidad: string;

  @ApiProperty({ example: 'A-101', description: 'Aula o sala de la sesión' })
  @IsNotEmpty()
  @IsString()
  aula: string;

  @ApiProperty({ example: 'COD123', description: 'Código de verificación para asistencia' })
  @IsNotEmpty()
  @IsString()
  cod_verificacion: string;

  @ApiProperty({ example: 'uuid-detalle-123', description: 'ID del detalle de la actividad académica' })
  @IsNotEmpty()
  @IsString()
  id_detalle_actividad_academica: string;
}
