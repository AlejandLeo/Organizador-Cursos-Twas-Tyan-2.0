import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePosteoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contenido: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  estado: string;
}
