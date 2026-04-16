import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO para cambiar la contraseña de un usuario.
 * Requiere la contraseña actual para verificar y la nueva contraseña.
 */
export class ChangePasswordDto {
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria.' })
  @IsString()
  password_actual: string;

  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria.' })
  @IsString()
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres.',
  })
  password_nuevo: string;
}
