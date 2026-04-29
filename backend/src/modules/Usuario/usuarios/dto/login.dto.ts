import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
}
