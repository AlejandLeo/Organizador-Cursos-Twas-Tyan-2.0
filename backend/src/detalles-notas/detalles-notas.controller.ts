// Módulo no activo en v2. Placeholder.
import { Controller } from '@nestjs/common';
import { DetallesNotasService } from './detalles-notas.service';

@Controller('detalles-notas')
export class DetallesNotasController {
  constructor(private readonly detallesNotasService: DetallesNotasService) {}
}
