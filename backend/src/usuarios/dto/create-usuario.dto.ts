import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePerfilDto } from './create-perfil.dto';

export class CreateUsuarioDto {
  
  // --- CAMPOS DE USUARIOS ---

  @ApiProperty({ example: 'usuario@ejemplo.com', description: 'Correo electrónico del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña del usuario' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'ACTIVO', description: 'Estado del usuario' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ example: 'cert-uuid-123', description: 'ID del certificado (si aplica)' })
  @IsOptional()
  @IsString()
  id_certificado?: string;

  // --- DATOS DEL PERFIL ---
  
  @ApiProperty({ type: CreatePerfilDto, description: 'Datos del perfil del usuario' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreatePerfilDto)
  perfil: CreatePerfilDto;

}
