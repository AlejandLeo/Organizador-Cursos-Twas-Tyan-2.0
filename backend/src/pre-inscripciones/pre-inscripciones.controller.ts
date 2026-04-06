import { Controller } from '@nestjs/common';
import { PreInscripcionesService } from './pre-inscripciones.service';

// Módulo no activo en v2. Placeholder.
@Controller('pre-inscripciones')
export class PreInscripcionesController {
  constructor(private readonly preInscripcionesService: PreInscripcionesService) {}
}
