import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * DTO para registro completo: crea USUARIO + PERSONA en una sola petición.
 * El backend los inserta en transacción para garantizar consistencia.
 */
export class RegisterDto {
  // --- Credenciales (tabla: usuarios) ---
  @IsEmail({}, { message: 'Debe proporcionar un email válido.' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;

  // --- Datos personales (tabla: personas) ---
  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  primer_apellido?: string;

  @IsOptional()
  @IsString()
  segundo_apellido?: string;

  @IsOptional()
  @IsString()
  documento_identidad?: string;

  @IsOptional()
  @IsEnum(['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'], {
    message:
      'Género inválido. Opciones: Masculino, Femenino, Otro, Prefiero no decir.',
  })
  genero?: string;

  @IsOptional()
  @IsString()
  pais_origen?: string;

  @IsOptional()
  @IsString()
  pais_residencia?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'fecha_nacimiento debe estar en formato YYYY-MM-DD.' },
  )
  fecha_nacimiento?: string;

  @IsOptional()
  @IsString()
  celular?: string;
}
