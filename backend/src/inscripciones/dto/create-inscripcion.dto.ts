import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInscripcionDto {
  @ApiProperty({ example: 'INSCRITO', description: 'Estado de la inscripción' })
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty({ example: '2026-03-21', description: 'Fecha de registro de la inscripción' })
  @IsNotEmpty()
  @IsDateString()
  fecha_registro: string;

  @ApiProperty({ example: 'uuid-usuario-123', description: 'ID del usuario inscrito' })
  @IsNotEmpty()
  @IsString()
  id_usuario: string;

  @ApiProperty({ example: 'uuid-detalle-actividad-123', description: 'ID del detalle de la actividad académica' })
  @IsNotEmpty()
  @IsString()
  id_detalle_actividad_academica: string;
}
