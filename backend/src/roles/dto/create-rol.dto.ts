import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nombre_rol: string;
}
