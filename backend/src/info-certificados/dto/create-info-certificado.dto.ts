import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInfoCertificadoDto {
  @ApiProperty({ example: 'Certificado de Participación', description: 'Título o cabecera del certificado' })
  @IsNotEmpty()
  @IsString()
  cabecera: string;

  @ApiProperty({ example: 'Por haber completado satisfactoriamente el curso...', description: 'Cuerpo o tenor del certificado' })
  @IsNotEmpty()
  @IsString()
  tenor: string;

  @ApiProperty({ example: 'uuid-version-123', description: 'ID de la versión del evento' })
  @IsNotEmpty()
  @IsString()
  id_version_evento: string;
}
