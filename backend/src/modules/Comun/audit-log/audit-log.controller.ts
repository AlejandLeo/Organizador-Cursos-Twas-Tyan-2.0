import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly service: AuditLogService) {}

  /**
   * POST /audit-log — Crear un registro de auditoría.
   */
  @Post()
  async registrar(
    @Body()
    body: {
      modulo: string;
      accion: string;
      descripcion: string;
      usuario: string;
      entidad_id?: string;
      entidad_nombre?: string;
      cambios?: any;
      metadatos?: any;
    },
  ) {
    return this.service.registrar(body);
  }

  /**
   * GET /audit-log — Listar registros con paginación y filtros.
   * Query params: page, limit, modulo, accion, busqueda, fechaDesde, fechaHasta
   */
  @Get()
  async listar(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('modulo') modulo?: string,
    @Query('accion') accion?: string,
    @Query('busqueda') busqueda?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.service.listar({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      modulo,
      accion,
      busqueda,
      fechaDesde,
      fechaHasta,
    });
  }

  /**
   * GET /audit-log/exportar — Obtener todos los registros filtrados (para Excel/PDF).
   */
  @Get('exportar')
  async exportar(
    @Query('modulo') modulo?: string,
    @Query('accion') accion?: string,
    @Query('busqueda') busqueda?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.service.exportar({ modulo, accion, busqueda, fechaDesde, fechaHasta });
  }

  /**
   * DELETE /audit-log/:id — Eliminar un registro.
   */
  @Delete(':id')
  async eliminar(@Param('id') id: string) {
    await this.service.eliminar(Number(id));
    return { message: 'Registro eliminado' };
  }

  /**
   * DELETE /audit-log — Limpiar toda la bitácora.
   */
  @Delete()
  async limpiarTodo() {
    await this.service.limpiarTodo();
    return { message: 'Bitácora limpiada' };
  }
}
