import { IsOptional, IsString } from 'class-validator';

export class CreateCertificadoDto {
  @IsString()
  codigo_certificado: string;

  @IsString()
  uuid_archivo: string;

  @IsOptional()
  hash_integridad?: string;

  @IsOptional()
  tipo?: number;
}
