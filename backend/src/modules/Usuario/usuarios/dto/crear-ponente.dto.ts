import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear un Ponente directamente desde el panel del Coordinador.
 * Crea Usuario + Persona + Rol Ponente en una sola transacción.
 */
export class CrearPonenteDto {
  @ApiProperty({ example: 'ponente@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'Juan Carlos' })
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiPropertyOptional({ example: 'García' })
  @IsOptional()
  @IsString()
  primer_apellido?: string;

  @ApiPropertyOptional({ example: 'López' })
  @IsOptional()
  @IsString()
  segundo_apellido?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  documento_identidad?: string;

  @ApiPropertyOptional({ example: 'Bolivia' })
  @IsOptional()
  @IsString()
  pais_origen?: string;

  @ApiPropertyOptional({ example: 'Bolivia' })
  @IsOptional()
  @IsString()
  pais_residencia?: string;

  @ApiPropertyOptional({ example: '+591 70000000' })
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiPropertyOptional({ example: 'Ingeniero de Sistemas' })
  @IsOptional()
  @IsString()
  profesion?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  id_grado_academico?: number;

  @ApiPropertyOptional({ example: 5, description: 'ID del Rol (2=Coordinador, 5=Ponente)' })
  @IsOptional()
  @IsInt()
  id_rol?: number;

  @ApiPropertyOptional({ example: true, description: 'Si se debe enviar correo de bienvenida' })
  @IsOptional()
  @IsBoolean()
  notificar?: boolean;
}

