import { Controller } from '@nestjs/common';
import { PerfilesService } from './perfiles.service';

// Módulo reemplazado por PersonasModule en v2.
@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}
}
