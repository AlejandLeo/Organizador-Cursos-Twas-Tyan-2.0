import { PartialType } from '@nestjs/swagger';
import { CreateInfoCertificadoDto } from './create-info-certificado.dto';

export class UpdateInfoCertificadoDto extends PartialType(
  CreateInfoCertificadoDto,
) {}
