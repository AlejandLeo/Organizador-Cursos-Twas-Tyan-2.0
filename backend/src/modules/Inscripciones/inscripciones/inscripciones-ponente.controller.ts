import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Inscripciones (Ponente)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Ponente')
@ApiBearerAuth()
@Controller('ponente/inscripciones')
export class InscripcionesPonenteController {
  constructor(private readonly service: InscripcionesService) {}

  @Get('actividad/:actividadId')
  @ApiOperation({ summary: 'Listar inscripciones de una actividad (Solo Ponente asignado)' })
  findByActividadPonente(
    @Param('actividadId', ParseIntPipe) actividadId: number,
    @Request() req: any,
  ) {
    return this.service.findByActividadParaPonente(actividadId, req.user.id);
  }

  @Patch('actividad/:actividadId/:inscripcionId/nota')
  @ApiOperation({ summary: 'Actualizar nota (Solo Ponente asignado a la actividad)' })
  actualizarNotaPonente(
    @Param('actividadId', ParseIntPipe) actividadId: number,
    @Param('inscripcionId', ParseIntPipe) inscripcionId: number,
    @Body('nota') nota: number,
    @Request() req: any,
  ) {
    return this.service.actualizarNotaParaPonente(actividadId, inscripcionId, nota, req.user.id);
  }
}
