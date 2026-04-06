import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImparticionDto {
  @ApiProperty({ example: 'uuid-usuario-docente', description: 'ID del usuario docente' })
  @IsNotEmpty()
  @IsString()
  id_usuario: string;

  @ApiProperty({ example: 'uuid-detalle-actividad', description: 'ID del detalle de actividad académica' })
  @IsNotEmpty()
  @IsString()
  id_detalle_actividad_academica: string;
}
