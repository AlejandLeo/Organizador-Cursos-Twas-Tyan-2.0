import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActividadAcademicaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tipo: string;

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
  id_version_evento: string;
}
