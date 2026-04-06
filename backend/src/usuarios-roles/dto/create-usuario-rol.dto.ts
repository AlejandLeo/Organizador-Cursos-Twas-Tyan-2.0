import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioRolDto {
  @ApiProperty({ example: 'ACTIVO', description: 'Estado de la asignación del rol' })
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty({ example: 'uuid-usuario-123', description: 'ID del usuario' })
  @IsNotEmpty()
  @IsString()
  id_usuario: string;

  @ApiProperty({ example: 'uuid-rol-123', description: 'ID del rol asignado' })
  @IsNotEmpty()
  @IsString()
  id_rol: string;
}
