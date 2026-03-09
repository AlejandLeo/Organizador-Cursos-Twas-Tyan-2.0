import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInfoCertificadoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cabecera: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tenor: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_version_evento: string;
}
