import { Controller } from '@nestjs/common';
import { CursoModalidadesService } from './curso-modalidades.service';

@Controller('curso-modalidades')
export class CursoModalidadesController {
  constructor(
    private readonly cursoModalidadesService: CursoModalidadesService,
  ) {}
}
