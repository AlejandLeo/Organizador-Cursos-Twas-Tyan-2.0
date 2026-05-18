import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EmitirLoteTipoDto {
  @ApiProperty({ example: 1, description: 'ID de la plantilla InfoCertificado' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_info_certificado: number;

  @ApiProperty({ example: 1, description: 'ID de la Actividad Académica (requerido para tipo 1 y 2)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_actividad_academica?: number;

  @ApiProperty({ example: 1, description: 'ID del Evento (requerido para tipo 3)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_evento?: number;

  /**
   * 1 = Asistente (Inscripciones)
   * 2 = Expositor (Imparticiones)
   * 3 = Apoyo/Logística (CoordinacionEvento con rol Logística)
   * 4 = Docente (Imparticiones)
   */
  @ApiProperty({ example: 1, description: 'Tipo de certificado: 1=Asistente, 2=Expositor, 3=Logística, 4=Docente' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  tipo: number;

  @ApiProperty({ example: [1, 2, 3], description: 'IDs de los usuarios que recibirán el certificado' })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  personasIds: number[];

  @ApiProperty({ example: 'Firma de director' })
  @IsNotEmpty()
  @IsString()
  firma: string;
}
