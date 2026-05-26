import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarPonenteDto {
  @ApiProperty({ example: 'ponente@ejemplo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  nombres: string;

  @ApiProperty({ example: 'Perez' })
  @IsString()
  @IsNotEmpty()
  primer_apellido: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id_actividad: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  id_evento: number;

  @ApiPropertyOptional({ example: 'Avances en inteligencia artificial aplicada', description: 'Temática o título de la presentación' })
  @IsOptional()
  @IsString()
  tematica?: string;
}
