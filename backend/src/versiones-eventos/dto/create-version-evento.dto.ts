import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVersionEventoDto {
  @ApiProperty({ example: 'Primera Versión del Congreso', description: 'Descripción de la versión del evento' })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({ example: '2026-I', description: 'Gestión académica o administrativa' })
  @IsNotEmpty()
  @IsString()
  gestion: string;

  @ApiProperty({ example: 'Auditorio Principal', description: 'Nombre de la ubicación' })
  @IsNotEmpty()
  @IsString()
  ubicacion: string;

  @ApiProperty({ example: 'Av. Siempre Viva 123', description: 'Dirección física del evento' })
  @IsNotEmpty()
  @IsString()
  direccion: string;

  @ApiProperty({ example: '2026-03-20', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @ApiProperty({ example: '2026-03-25', description: 'Fecha de finalización (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @ApiProperty({ example: 'ACTIVO', description: 'Estado de la versión del evento' })
  @IsNotEmpty()
  @IsString()
  estado: string;

  @ApiProperty({ example: 'uuid-evento-123', description: 'ID del evento padre' })
  @IsNotEmpty()
  @IsString()
  id_evento: string;
}
