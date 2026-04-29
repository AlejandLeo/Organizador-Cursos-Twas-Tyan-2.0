import { Controller } from '@nestjs/common';
import { AfiliacionesService } from './afiliaciones.service';

@Controller('afiliaciones')
export class AfiliacionesController {
  constructor(private readonly afiliacionesService: AfiliacionesService) {}
}
