import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio.' })
  @IsString()
  @MaxLength(50, {
    message: 'El nombre del rol no puede exceder los 50 caracteres.',
  })
  nombre_rol: string;
}
