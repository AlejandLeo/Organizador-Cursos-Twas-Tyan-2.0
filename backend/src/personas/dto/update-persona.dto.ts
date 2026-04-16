import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePersonaDto {
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
    { message: 'fecha_nacimiento debe tener formato YYYY-MM-DD.' },
  )
  fecha_nacimiento?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsString()
  firma_dig?: string;
}
