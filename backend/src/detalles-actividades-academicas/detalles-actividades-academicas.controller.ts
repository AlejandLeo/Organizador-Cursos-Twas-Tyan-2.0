import { Controller } from '@nestjs/common';
import { DetallesActividadesAcademicasService } from './detalles-actividades-academicas.service';

// Módulo reemplazado por CursoModalidadesModule en v2.
@Controller('detalles-actividades-academicas')
export class DetallesActividadesAcademicasController {
  constructor(private readonly service: DetallesActividadesAcademicasService) {}
}
