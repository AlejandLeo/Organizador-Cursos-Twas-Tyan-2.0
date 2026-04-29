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
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Inscripciones (Admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('admin/inscripciones')
export class InscripcionesAdminController {
  constructor(private readonly service: InscripcionesService) {}

  @Roles('Coordinador', 'Super Usuario', 'Logística')
  @Get()
  @ApiOperation({ summary: 'Listar inscripciones de un evento (Coordinador)' })
  @ApiQuery({ name: 'eventoId', required: false })
  findAll(
    @Query('eventoId') eventoId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (eventoId) {
      return this.service.findByEvento(
        Number(eventoId),
        page ? Number(page) : 1,
        limit ? Number(limit) : 20,
      );
    }
    return this.service.findAll();
  }

  @Roles('Coordinador', 'Super Usuario', 'Logística')
  @Get('usuario/:id')
  @ApiOperation({ summary: 'Inscripciones de un usuario por ID (Coordinador)' })
  findByUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByUsuarioId(id);
  }

  @Roles('Coordinador', 'Super Usuario', 'Logística')
  @Get('actividad/:actividadId')
  @ApiOperation({ summary: 'Listar inscripciones por actividad específica' })
  findByActividad(@Param('actividadId', ParseIntPipe) actividadId: number) {
    return this.service.findByActividad(actividadId);
  }

  @Roles('Coordinador', 'Super Usuario')
  @Patch(':id/nota')
  @ApiOperation({ summary: 'Actualizar nota de un estudiante' })
  actualizarNota(
    @Param('id', ParseIntPipe) id: number,
    @Body('nota') nota: number,
  ) {
    return this.service.actualizarNota(id, nota);
  }

  @Roles('Coordinador', 'Super Usuario')
  @Post()
  @ApiOperation({ summary: 'Inscribir estudiante manualmente (Coordinador)' })
  inscribir(@Body() dto: CreateInscripcionDto) {
    return this.service.inscribir(dto);
  }

  @Roles('Coordinador', 'Super Usuario')
  @Put(':id')
  @ApiOperation({ summary: 'Cambiar estado de inscripción (Coordinador)' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado', ParseIntPipe) estado: number,
    @Body('observacion') observacion?: string,
  ) {
    return this.service.cambiarEstado(id, Math.floor(estado), observacion);
  }

  @Roles('Coordinador', 'Super Usuario')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar inscripción (Coordinador)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
