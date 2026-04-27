import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SesionesAcademicasService } from './sesiones-academicas.service';

@ApiTags('Sesiones Académicas')
@Controller('sesiones-academicas')
export class SesionesAcademicasController {
  constructor(private readonly service: SesionesAcademicasService) {}

  // ══════════════════════════════════════════════════════════
  //  PIN DE ASISTENCIA (Público)
  // ══════════════════════════════════════════════════════════

  /**
   * POST /sesiones-academicas/:id/verificar-pin
   * Valida el PIN enviado contra el hash almacenado en la sesión.
   * Uso interno: es llamado por el flujo de registro de asistencia por PIN.
   * También puede exponerse para que el estudiante verifique antes de enviar.
   */
  @Post(':id/verificar-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar PIN de asistencia (público, sin JWT)',
  })
  verificarPin(
    @Param('id', ParseIntPipe) id: number,
    @Body('pin') pin: string,
  ) {
    return this.service.verificarPin(id, pin);
  }

  /**
   * GET /sesiones-academicas/activas
   * Lista sesiones cuya fecha es hoy y que ya tienen un PIN generado.
   * Útil para que el estudiante seleccione la sesión en el formulario de PIN.
   * Opcionalmente filtra por modalidad (id_curso_modalidad).
   */
  @Get('activas')
  @ApiOperation({
    summary:
      'Listar sesiones activas hoy con PIN disponible (público, para formulario de asistencia)',
  })
  @ApiQuery({ name: 'modalidadId', required: false })
  findActivas(@Query('modalidadId') modalidadId?: string) {
    return this.service.findActivas(
      modalidadId ? Number(modalidadId) : undefined,
    );
  }
}
