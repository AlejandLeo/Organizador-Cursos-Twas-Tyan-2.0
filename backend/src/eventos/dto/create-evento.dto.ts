import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEventoDto {
  @ApiPropertyOptional({ example: 'Congreso TWAS-TYAN 2025' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Descripción del evento' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: '2025' })
  @IsOptional()
  @IsString()
  gestion?: string;

  @ApiPropertyOptional({ example: 'La Paz, Bolivia' })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({ example: 'Av. Arce 123' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: '2025-07-14' })
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @ApiPropertyOptional({ example: '2025-07-18' })
  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @ApiPropertyOptional({ example: 1, description: '1 = Activo | 0 = Finalizado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado?: number;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Logo/Portada del evento' })
  logo?: any;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Imagen de fondo del evento' })
  imagen_fondo?: any;
}
