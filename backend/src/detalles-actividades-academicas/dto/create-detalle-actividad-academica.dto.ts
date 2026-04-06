import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetalleActividadAcademicaDto {
  @ApiProperty({ example: 'EVALUACION', description: 'Tipo de detalle (EVALUACION, ASISTENCIA, etc.)' })
  @IsNotEmpty()
  @IsString()
  tipo: string;

  @ApiProperty({ example: '51', description: 'Nota mínima de aprobación' })
  @IsNotEmpty()
  @IsString()
  min_nota: string;

  @ApiProperty({ example: '80', description: 'Porcentaje mínimo de asistencia' })
  @IsNotEmpty()
  @IsString()
  min_asistencia: string;

  @ApiProperty({ example: 'uuid-actividad-123', description: 'ID de la actividad académica' })
  @IsNotEmpty()
  @IsString()
  id_actividad_academica: string;
}
