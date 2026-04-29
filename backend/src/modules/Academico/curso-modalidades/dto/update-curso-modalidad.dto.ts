import { PartialType } from '@nestjs/swagger';
import { CreateCursoModalidadDto } from './create-curso-modalidad.dto';

export class UpdateCursoModalidadDto extends PartialType(CreateCursoModalidadDto) {}
