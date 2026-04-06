import { Controller } from '@nestjs/common';
import { FirmasService } from './firmas.service';

// Módulo eliminado en v2.
@Controller('firmas')
export class FirmasController {
  constructor(private readonly firmasService: FirmasService) {}
}
