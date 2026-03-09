import { PartialType } from '@nestjs/swagger';
import { CreatePreInscripcionDto } from './create-pre-inscripcion.dto';

export class UpdatePreInscripcionDto extends PartialType(CreatePreInscripcionDto) {}
