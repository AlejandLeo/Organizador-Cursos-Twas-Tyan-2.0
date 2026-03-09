import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVersionEventoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  gestion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  ubicacion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  direccion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_evento: string;
}
