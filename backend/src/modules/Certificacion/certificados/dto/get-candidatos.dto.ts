import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetCandidatosDto {
  /**
   * 1 = Asistente (Inscripciones)
   * 2 = Expositor (Imparticiones)
   * 3 = Apoyo/Logística (CoordinacionEvento con rol Logística)
   * 4 = Docente (Imparticiones)
   */
  @ApiProperty({ example: '1', description: 'Tipo de certificado: 1=Asistente, 2=Expositor, 3=Logística, 4=Docente' })
  @IsNotEmpty()
  @IsString()
  tipo: string;

  @ApiPropertyOptional({ example: '1', description: 'ID de la Actividad Académica' })
  @IsOptional()
  @IsString()
  idActividad?: string;

  @ApiPropertyOptional({ example: '1', description: 'ID del Evento' })
  @IsOptional()
  @IsString()
  idEvento?: string;
}
