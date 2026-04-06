import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFirmaDto {
  @ApiProperty({ example: 'https://ejemplo.com/firma.png', description: 'URL de la imagen de la firma' })
  @IsNotEmpty()
  @IsUrl()
  url_firma: string;

  @ApiProperty({ example: 'uuid-usuario-123', description: 'ID del usuario propietario de la firma' })
  @IsNotEmpty()
  @IsString()
  id_usuario: string;
}
