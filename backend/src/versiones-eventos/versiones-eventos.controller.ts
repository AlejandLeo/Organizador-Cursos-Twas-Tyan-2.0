import { Controller } from '@nestjs/common';
import { VersionesEventosService } from './versiones-eventos.service';

// Módulo eliminado en v2.
@Controller('versiones-eventos')
export class VersionesEventosController {
  constructor(private readonly versionesEventosService: VersionesEventosService) {}
}
