import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePerfilDto {
  @ApiProperty({ example: 'Juan', description: 'Nombres del usuario' })
  @IsNotEmpty()
  @IsString()
  nombres: string;

  @ApiProperty({ example: 'Pérez', description: 'Primer apellido del usuario' })
  @IsNotEmpty()
  @IsString()
  primer_apellido: string;

  @ApiPropertyOptional({ example: 'López', description: 'Segundo apellido del usuario (opcional)' })
  @IsOptional()
  @IsString()
  segundo_apellido?: string;

  @ApiProperty({ example: '12345678', description: 'Documento de identidad (CI, Pasaporte)' })
  @IsNotEmpty()
  @IsString()
  documento_identidad: string;

  @ApiProperty({ example: 'MASCULINO', description: 'Género del usuario' })
  @IsNotEmpty()
  @IsString()
  genero: string;

  @ApiProperty({ example: 'Bolivia', description: 'País de origen' })
  @IsNotEmpty()
  @IsString()
  pais_origen: string;

  @ApiProperty({ example: 'La Paz', description: 'País o ciudad de residencia actual' })
  @IsNotEmpty()
  @IsString()
  pais_residencia: string;

  @ApiProperty({ example: '1990-01-01', description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  fecha_nacimiento: string;

  @ApiProperty({ example: '+591 70000000', description: 'Número de celular de contacto' })
  @IsNotEmpty()
  @IsString()
  celular: string;

  @ApiProperty({ example: 'Universidad Mayor de San Andrés', description: 'Institución de afiliación' })
  @IsNotEmpty()
  @IsString()
  afiliacion: string;

  @ApiProperty({ example: 'DOCENTE', description: 'Tipo de afiliación (ESTUDIANTE, DOCENTE, ETC)' })
  @IsNotEmpty()
  @IsString()
  tipo_afiliacion: string;

  @ApiProperty({ example: 'Ingeniería de Software', description: 'Área temática de especialidad' })
  @IsNotEmpty()
  @IsString()
  area_tematica: string;

  @ApiProperty({ example: 'Ciencias de la Computación', description: 'Disciplina científica' })
  @IsNotEmpty()
  @IsString()
  disciplina_cientifica: string;

  @ApiProperty({ example: 'M.Sc.', description: 'Grado académico alcanzado' })
  @IsNotEmpty()
  @IsString()
  grado_academico: string;

  @ApiProperty({ example: 'uuid-usuario-123', description: 'ID del usuario asociado al perfil' })
  @IsNotEmpty()
  @IsString()
  id_usuario: string;
}
