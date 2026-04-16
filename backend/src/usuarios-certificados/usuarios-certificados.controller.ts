import { Controller } from '@nestjs/common';
import { UsuariosCertificadosService } from './usuarios-certificados.service';

@Controller('usuarios-certificados')
export class UsuariosCertificadosController {
  constructor(
    private readonly usuariosCertificadosService: UsuariosCertificadosService,
  ) {}
}
