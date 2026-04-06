import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCoordinacionDto {
  @ApiProperty({ example: 'uuid-usuario-coordinador', description: 'ID del usuario coordinador' })
  @IsNotEmpty()
  @IsString()
  id_usuario: string;

  @ApiProperty({ example: 'uuid-version-evento', description: 'ID de la versión del evento' })
  @IsNotEmpty()
  @IsString()
  id_version_evento: string;
}
