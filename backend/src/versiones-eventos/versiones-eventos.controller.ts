import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VersionesEventosService } from './versiones-eventos.service';
import { CreateVersionEventoDto } from './dto/create-version-evento.dto';
import { UpdateVersionEventoDto } from './dto/update-version-evento.dto';

@ApiTags('versiones-eventos')
@Controller('versiones-eventos')
export class VersionesEventosController {
  constructor(private readonly versionesEventosService: VersionesEventosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva versión de evento' })
  @ApiResponse({ status: 201, description: 'La versión del evento ha sido creada exitosamente.' })
  create(@Body() createVersionEventoDto: CreateVersionEventoDto) {
    return this.versionesEventosService.create(createVersionEventoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las versiones de eventos' })
  @ApiResponse({ status: 200, description: 'Lista de versiones de eventos retornada exitosamente.' })
  findAll() {
    return this.versionesEventosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una versión de evento por ID' })
  @ApiResponse({ status: 200, description: 'Versión del evento encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Versión del evento no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.versionesEventosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una versión de evento existente' })
  @ApiResponse({ status: 200, description: 'Versión del evento actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Versión del evento no encontrada.' })
  update(@Param('id') id: string, @Body() updateVersionEventoDto: UpdateVersionEventoDto) {
    return this.versionesEventosService.update(id, updateVersionEventoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una versión de evento' })
  @ApiResponse({ status: 200, description: 'Versión del evento eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Versión del evento no encontrada.' })
  remove(@Param('id') id: string) {
    return this.versionesEventosService.remove(id);
  }
}
