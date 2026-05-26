import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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
