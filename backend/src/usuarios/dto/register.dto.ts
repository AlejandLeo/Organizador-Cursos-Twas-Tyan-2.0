import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
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
  @IsInt({ message: 'El género debe ser un número entero (0-3).' })
  @Min(0)
  @Max(3)
  genero?: number;

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

  // --- Datos académicos/institucionales (tabla: afiliaciones) ---
  @IsOptional()
  @IsString()
  institucion?: string;

  @IsOptional()
  @IsString()
  tipo_afiliacion?: string;

  @IsOptional()
  @IsString()
  area_tematica?: string;

  @IsOptional()
  @IsString()
  disciplina_cientifica?: string;

  @IsOptional()
  @IsInt({ message: 'El id_grado_academico debe ser un número entero.' })
  id_grado_academico?: number;
}
