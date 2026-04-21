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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Inscripciones')
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly service: InscripcionesService) {}

  // ── Coordinador ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Inscribir estudiante manualmente (Coordinador)' })
  inscribir(@Body() dto: CreateInscripcionDto) {
    return this.service.inscribir(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Cambiar estado de inscripción (Coordinador)' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado', ParseIntPipe) estado: number,
  ) {
    return this.service.cambiarEstado(id, Math.floor(estado));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar inscripción (Coordinador)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
