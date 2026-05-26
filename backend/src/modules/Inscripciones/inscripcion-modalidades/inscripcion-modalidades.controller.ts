import { Controller } from '@nestjs/common';
import { InscripcionModalidadesService } from './inscripcion-modalidades.service';

@Controller('inscripcion-modalidades')
export class InscripcionModalidadesController {
  constructor(
    private readonly inscripcionModalidadesService: InscripcionModalidadesService,
  ) {}
}
