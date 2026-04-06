import { Controller } from '@nestjs/common';
import { NotasService } from './notas.service';

// Módulo eliminado en v2.
@Controller('notas')
export class NotasController {
  constructor(private readonly notasService: NotasService) {}
}
