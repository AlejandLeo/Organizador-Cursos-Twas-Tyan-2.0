import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetalleNotaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  puntaje: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_nota: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_detalle_actividad_academica: string;
}
