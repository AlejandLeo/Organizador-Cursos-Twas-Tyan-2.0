import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * DTO para iniciar sesión.
 * Validamos email y password antes de comparar con la BD.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Debe proporcionar un email válido.' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString()
  password: string;

  /** Portal al que se intenta acceder (opcional para priorizar validación) */
  @IsOptional()
  @IsString()
  portal?: string;
}
