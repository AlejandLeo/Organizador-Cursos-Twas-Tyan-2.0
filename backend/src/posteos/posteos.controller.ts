import { Controller } from '@nestjs/common';
import { PosteosService } from './posteos.service';

// Módulo eliminado en v2.
@Controller('posteos')
export class PosteosController {
  constructor(private readonly posteosService: PosteosService) {}
}
