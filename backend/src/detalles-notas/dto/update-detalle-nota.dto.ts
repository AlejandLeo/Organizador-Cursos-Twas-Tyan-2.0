import { PartialType } from '@nestjs/swagger';
import { CreateDetalleNotaDto } from './create-detalle-nota.dto';

export class UpdateDetalleNotaDto extends PartialType(CreateDetalleNotaDto) {}
