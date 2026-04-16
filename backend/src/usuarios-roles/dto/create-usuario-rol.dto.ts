import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioRolDto {
  @ApiProperty({ description: 'ID del usuario al que se le asigna el rol' })
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio.' })
  @IsNumber({}, { message: 'El ID del usuario debe ser un número.' })
  id_usuario: number;

  @ApiProperty({ description: 'ID del rol asignado' })
  @IsNotEmpty({ message: 'El ID del rol es obligatorio.' })
  @IsNumber({}, { message: 'El ID del rol debe ser un número.' })
  id_rol: number;

  @ApiProperty({
    description: 'Estado de la asignación. 1 = Activo, 0 = Inactivo',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  estado?: number;
}
