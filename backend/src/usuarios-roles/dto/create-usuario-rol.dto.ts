import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioRolDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_usuario: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_rol: string;
}
