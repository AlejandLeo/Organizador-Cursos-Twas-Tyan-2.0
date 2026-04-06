import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolDto {
  @ApiProperty({ example: 'ADMINISTRADOR', description: 'Nombre del rol del sistema' })
  @IsNotEmpty()
  @IsString()
  nombre_rol: string;
}
