import { PartialType } from '@nestjs/swagger';
import { CreateDetalleActividadAcademicaDto } from './create-detalle-actividad-academica.dto';

export class UpdateDetalleActividadAcademicaDto extends PartialType(CreateDetalleActividadAcademicaDto) {}
