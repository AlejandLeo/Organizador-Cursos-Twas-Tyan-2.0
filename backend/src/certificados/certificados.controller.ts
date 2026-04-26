import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { EmitirLoteDto } from './dto/emitir-lote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Certificados')
@Controller('certificados')
export class CertificadosController {
  constructor(private readonly service: CertificadosService) {}

  // ── Coordinador ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post('emitir-lote')
  @ApiOperation({ summary: 'Emitir múltiples certificados (Coordinador)' })
  emitirLote(@Body() dto: EmitirLoteDto) {
    return this.service.emitirLote(dto);
  }

  // ══════════════════════════════════════════════════════════
  //  VERIFICACIÓN PÚBLICA
  // ══════════════════════════════════════════════════════════

  /**
   * GET /certificados/verificar/:codigo
   * Endpoint PÚBLICO (sin JWT).
   * Verifica la autenticidad de un certificado usando el código que aparece
   * impreso en el QR del certificado.
   * Equivalente al endpoint /cert/verificar/:search del sistema Flask.
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

  // ══════════════════════════════════════════════════════════
  //  VISTA ESTUDIANTE
  // ══════════════════════════════════════════════════════════

  /**
   * GET /certificados/mis-certificados
   * Devuelve los certificados del usuario autenticado (Estudiante).
   * Equivalente al endpoint /cert/listar-certificados/:id del sistema Flask.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('mis-certificados')
  @ApiOperation({
    summary: 'Mis certificados (Estudiante autenticado)',
  })
  misCertificados(@Request() req: any) {
    return this.service.findByUsuario(req.user.sub || req.user.id);
  }

  // ── Legacy ──────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
