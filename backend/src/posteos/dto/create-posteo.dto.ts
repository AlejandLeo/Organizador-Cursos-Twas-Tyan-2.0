import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePosteoDto {
  @ApiProperty({ example: 'Bienvenidos al Congreso', description: 'Título del posteo o noticia' })
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @ApiProperty({ example: 'Información general sobre el evento...', description: 'Contenido detallado del posteo' })
  @IsNotEmpty()
  @IsString()
  contenido: string;

  @ApiProperty({ example: 'PUBLICADO', description: 'Estado del posteo (BORRADOR, PUBLICADO)' })
  @IsNotEmpty()
  @IsString()
  estado: string;
}
