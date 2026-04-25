import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service';
import { BatchAsistenciaDto } from './dto/batch-asistencia.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Asistencias')
@Controller('asistencias')
export class AsistenciasController {
  constructor(private readonly service: AsistenciasService) {}

  // ── Coordinador: Lote ───────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Ponente')
  @ApiBearerAuth()
  @Post('batch')
  @ApiOperation({ summary: 'Registrar múltiples asistencias (Coord/Docente)' })
  registerBatch(@Body() dto: BatchAsistenciaDto) {
    return this.service.registerBatch(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Ponente')
  @ApiBearerAuth()
  @Get('sesion/:sesionId')
  @ApiOperation({ summary: 'Listar asistencias de una sesión (Coord/Docente)' })
  getBySesion(@Param('sesionId', ParseIntPipe) sesionId: number) {
    return this.service.getBySesion(sesionId);
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
