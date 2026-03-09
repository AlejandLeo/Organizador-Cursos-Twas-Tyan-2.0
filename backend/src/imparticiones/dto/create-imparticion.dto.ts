import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImparticionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_usuario: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_detalle_actividad_academica: string;
}
