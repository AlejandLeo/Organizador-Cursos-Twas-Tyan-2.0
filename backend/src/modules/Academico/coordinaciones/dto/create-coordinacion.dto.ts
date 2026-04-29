import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCoordinacionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_usuario: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_version_evento: string;
}
