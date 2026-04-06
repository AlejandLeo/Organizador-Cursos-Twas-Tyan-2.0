import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventoDto {
  @ApiProperty({ example: 'Congreso de Tecnología 2026', description: 'Nombre del evento' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'Evento anual de tecnología e innovación', description: 'Descripción detallada del evento' })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @ApiProperty({ example: '2026', description: 'Gestión anual del evento' })
  @IsNotEmpty()
  @IsString()
  gestion: string;

  @ApiPropertyOptional({ example: 'https://ejemplo.com/logo.png', description: 'URL del logo del evento' })
  @IsOptional()
  @IsString()
  logo?: string;
}
