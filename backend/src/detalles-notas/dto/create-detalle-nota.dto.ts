import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetalleNotaDto {
  @ApiProperty({ example: 10, description: 'Puntaje obtenido en este detalle' })
  @IsNotEmpty()
  @IsNumber()
  puntaje: number;

  @ApiProperty({ example: 'Participación en clase', description: 'Descripción o concepto del puntaje' })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({ example: 'uuid-nota-123', description: 'ID de la nota principal' })
  @IsNotEmpty()
  @IsString()
  id_nota: string;

  @ApiProperty({ example: 'uuid-detalle-actividad-123', description: 'ID del detalle de actividad académica' })
  @IsNotEmpty()
  @IsString()
  id_detalle_actividad_academica: string;
}
