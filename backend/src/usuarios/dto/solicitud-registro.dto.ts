import { IsNotEmpty, IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

/**
 * DTO para la solicitud de registro de nuevo usuario.
 * Solo requiere datos básicos de identidad + credenciales.
 * El documento adjunto se sube como multipart/form-data por separado.
 * La cuenta queda en estado PENDIENTE (2) hasta ser aprobada.
 */
export class SolicitudRegistroDto {
  // --- Datos de identidad ---
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  nombres: string;

  @IsNotEmpty({ message: 'El primer apellido es obligatorio.' })
  @IsString()
  primer_apellido: string;

  @IsOptional()
  @IsString()
  segundo_apellido?: string;

  @IsNotEmpty({ message: 'El documento de identidad es obligatorio.' })
  @IsString()
  documento_identidad: string;

  // --- Credenciales ---
  @IsEmail({}, { message: 'Debe proporcionar un email válido.' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;
}
