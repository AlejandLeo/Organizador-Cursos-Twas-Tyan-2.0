import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUsuarioRolDto } from 'src/usuarios-roles/dto/create-usuario-rol.dto';

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

}
