import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';

@ApiTags('Certificados')
@Controller('certificados')
export class CertificadosController {
  constructor(private readonly service: CertificadosService) {}

  /**
   * GET /certificados/verificar/:codigo
   * Endpoint PÚBLICO (sin JWT).
   * Verifica la autenticidad de un certificado usando el código que aparece
   * impreso en el QR del certificado.
   */
  @Get('verificar/:codigo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Verificar autenticidad de un certificado por su código (Público, sin JWT)',
  })
  verificar(@Param('codigo') codigo: string) {
    return this.service.verificar(codigo);
  }
}
