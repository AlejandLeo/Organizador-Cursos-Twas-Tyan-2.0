import { PartialType } from '@nestjs/swagger';
import { CreateCertificadoDto } from './create-certificado.dto';

export class UpdateCertificadoDto extends PartialType(CreateCertificadoDto) {}
