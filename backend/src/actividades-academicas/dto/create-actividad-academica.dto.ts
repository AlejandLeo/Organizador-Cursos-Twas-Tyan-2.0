import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActividadAcademicaDto {
  @ApiProperty({ example: 'Taller de IA', description: 'Nombre de la actividad académica' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'TALLER', description: 'Tipo de actividad (TALLER, SEMINARIO, etc.)' })
  @IsNotEmpty()
  @IsString()
  tipo: string;

  @ApiProperty({ example: '2026-03-21', description: 'Fecha de inicio de la actividad' })
  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @ApiProperty({ example: '2026-03-21', description: 'Fecha de fin de la actividad' })
  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @ApiProperty({ example: 'uuid-version-123', description: 'ID de la versión del evento' })
  @IsNotEmpty()
  @IsString()
  id_version_evento: string;
}
