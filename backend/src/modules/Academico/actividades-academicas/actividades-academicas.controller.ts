import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe, UseGuards, Query, Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActividadesAcademicasService } from './actividades-academicas.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Actividades Académicas')
@Controller('actividades-academicas')
export class ActividadesAcademicasController {
  constructor(private readonly service: ActividadesAcademicasService) {}

  /** GET /actividades-academicas — lista todas */
  @Get()
  @ApiOperation({ summary: 'Listar actividades académicas' })
  findAll() {
    return this.service.findAll();
  }

  /** GET /actividades-academicas/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una actividad' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // ── Coordinador ─────────────────────────────────────────────

  /** POST /actividades-academicas */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear actividad académica (Coordinador)' })
  crear(@Body() dto: CreateActividadDto, @Request() req: any) {
    return this.service.crear(dto, req.user);
  }

  /** PUT /actividades-academicas/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar actividad académica (Coordinador)' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadDto,
    @Request() req: any,
  ) {
    return this.service.actualizar(id, dto, req.user);
  }

  /** DELETE /actividades-academicas/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar actividad académica (Coordinador)' })
  eliminar(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.eliminar(id, req.user);
  }
}
