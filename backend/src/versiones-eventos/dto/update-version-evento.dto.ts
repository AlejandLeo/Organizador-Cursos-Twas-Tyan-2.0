import { PartialType } from '@nestjs/swagger';
import { CreateVersionEventoDto } from './create-version-evento.dto';

export class UpdateVersionEventoDto extends PartialType(CreateVersionEventoDto) {}
