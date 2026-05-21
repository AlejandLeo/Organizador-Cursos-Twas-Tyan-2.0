import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEventoDto {
  @ApiPropertyOptional({ example: 'Congreso TWAS-TYAN 2025' })
  @IsNotEmpty({ message: 'El nombre del evento es obligatorio' })
  @IsString()
  @MaxLength(255)
  nombre: string;

  @ApiPropertyOptional({ example: 'Descripción del evento' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: '2025' })
  @IsNotEmpty({ message: 'La gestión es obligatoria' })
  @IsString()
  gestion: string;

  @ApiPropertyOptional({ example: 'La Paz, Bolivia' })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({ example: 'Av. Arce 123' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: '+591 2 2792238' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @ApiPropertyOptional({ example: 'contacto@evento.com' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: '2025-07-14' })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (AAAA-MM-DD)' })
  fecha_inicio: string;

  @ApiPropertyOptional({ example: '2025-07-18' })
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (AAAA-MM-DD)' })
  fecha_fin: string;

  @ApiPropertyOptional({ example: 1, description: '1 = Activo | 0 = Finalizado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado?: number;

  @ApiPropertyOptional({ example: 1, description: 'Fase del evento (1: Planificación, 2: Inscripciones, etc.)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fase?: number;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Logo/Portada del evento' })
  @IsOptional()
  logo?: any;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Logo/Portada del evento' })
  @IsOptional()
  imagen_portada?: any;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Imagen de fondo del evento' })
  @IsOptional()
  imagen_fondo?: any;

  @ApiPropertyOptional({ example: '3ra Edición' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 'Texto largo sobre el evento...' })
  @IsOptional()
  @IsString()
  sobre_evento_1?: string;

  @ApiPropertyOptional({ example: 'Más texto sobre el evento...' })
  @IsOptional()
  @IsString()
  sobre_evento_2?: string;

  @ApiPropertyOptional({ example: 'La frase inspiradora del evento.' })
  @IsOptional()
  @IsString()
  frase_destacada?: string;

  @ApiPropertyOptional({ example: 'https://maps.google.com/...' })
  @IsOptional()
  @IsString()
  google_maps_link?: string;

  @ApiPropertyOptional({ example: '[{day: 1, name: "Lunes", events: [...]}]' })
  @IsOptional()
  @IsString()
  cronograma?: string;

  @ApiPropertyOptional({ example: 'TWAS, TYAN, UMSA' })
  @IsOptional()
  @IsString()
  organizadores?: string;

  @ApiPropertyOptional({ example: 'OEA/TYAN' })
  @IsOptional()
  @IsString()
  sigla?: string;

  @ApiPropertyOptional({ example: 'Evento Oficial OEA/TYAN' })
  @IsOptional()
  @IsString()
  institucion_badge?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/...' })
  @IsOptional()
  @IsString()
  link_facebook?: string;

  @ApiPropertyOptional({ example: 'https://mi-evento.com' })
  @IsOptional()
  @IsString()
  link_web?: string;

  @ApiPropertyOptional({ example: '#0070b4' })
  @IsOptional()
  @IsString()
  color_principal?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  @IsOptional()
  @IsString()
  color_sigla?: string;

  @ApiPropertyOptional({ example: '#0070b4' })
  @IsOptional()
  @IsString()
  color_texto_header?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  @IsOptional()
  @IsString()
  color_titulo_2?: string;

  @ApiPropertyOptional({ example: '#0070b4' })
  @IsOptional()
  @IsString()
  color_badge_gestion?: string;

  @ApiPropertyOptional({ example: '#0070b4' })
  @IsOptional()
  @IsString()
  color_badge_institucion?: string;

  @ApiPropertyOptional({ example: '#0070b4' })
  @IsOptional()
  @IsString()
  color_badge_fecha?: string;

  @ApiPropertyOptional({ example: 'Subtítulo del evento' })
  @IsOptional()
  @IsString()
  nombre_2?: string;

  @ApiPropertyOptional({ example: '3' })
  @IsOptional()
  @IsString()
  prioridad?: string;

  @ApiPropertyOptional({ example: 'visible' })
  @IsOptional()
  @IsString()
  visibilidad_al_finalizar?: string;

  @ApiPropertyOptional({ example: '[1, 2, 3]', description: 'IDs de usuarios coordinadores adicionales' })
  @IsOptional()
  @IsString()
  coordinadores_ids?: string;

  @ApiPropertyOptional({ example: '[4, 5, 6]', description: 'IDs de usuarios de logística adicionales' })
  @IsOptional()
  @IsString()
  logistica_ids?: string;

  @ApiPropertyOptional({ example: '{"1": 2}', description: 'Mapa de grados administrativos por coordinador (JSON)' })
  @IsOptional()
  @IsString()
  coordinadores_grados?: string;
}
