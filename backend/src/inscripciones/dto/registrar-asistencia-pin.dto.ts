import { IsString, IsEmail, IsInt, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para el endpoint público de registro de asistencia por PIN.
 *
 * El estudiante envía:
 *  - Su email (para identificarlo sin necesidad de JWT)
 *  - El ID de la sesión académica activa
 *  - El PIN de 6 dígitos proyectado en clase
 */
export class RegistrarAsistenciaPinDto {
  @ApiProperty({ example: 'estudiante@example.com' })
  @IsEmail({}, { message: 'El campo email debe ser un correo válido.' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 42, description: 'ID de la sesión académica activa' })
  @IsInt({ message: 'id_sesion debe ser un número entero.' })
  id_sesion: number;

  @ApiProperty({ example: '083741', description: 'PIN numérico de 6 dígitos proyectado por el docente' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: 'El PIN debe tener al menos 4 caracteres.' })
  pin: string;
}
