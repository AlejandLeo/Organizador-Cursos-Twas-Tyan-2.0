import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePreInscripcionDto {
  @ApiProperty({ example: 'Taller de IA', description: 'Nombre de la actividad académica de interés' })
  @IsNotEmpty()
  @IsString()
  actividad_academica: string;

  @ApiProperty({ example: '2026-03-20', description: 'Fecha de registro de la pre-inscripción' })
  @IsNotEmpty()
  @IsDateString()
  fecha_registro: string;

  @ApiProperty({ example: 'SI', description: 'Indica si es miembro de TYAN (SI/NO)' })
  @IsNotEmpty()
  @IsString()
  miembro_tyan: string;

  @ApiProperty({ example: 'Interés académico', description: 'Razón de la pre-inscripción' })
  @IsNotEmpty()
  @IsString()
  razon: string;

  @ApiProperty({ example: 'PENDIENTE', description: 'Estado de la pre-inscripción' })
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty({ example: 'uuid-version-123', description: 'ID de la versión del evento' })
  @IsNotEmpty()
  @IsString()
  id_version_evento: string;

  @ApiProperty({ example: 'uuid-usuario-123', description: 'ID del usuario solicitante' })
  @IsNotEmpty()
  @IsString()
  id_usuario: string;
}
