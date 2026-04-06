import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PreInscripcionesService } from './pre-inscripciones.service';
import { CreatePreInscripcionDto } from './dto/create-pre-inscripcion.dto';
import { UpdatePreInscripcionDto } from './dto/update-pre-inscripcion.dto';

@ApiTags('pre-inscripciones')
@Controller('pre-inscripciones')
export class PreInscripcionesController {
  constructor(private readonly preInscripcionesService: PreInscripcionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva pre-inscripción' })
  @ApiResponse({ status: 201, description: 'La pre-inscripción ha sido creada exitosamente.' })
  create(@Body() createPreInscripcionDto: CreatePreInscripcionDto) {
    return this.preInscripcionesService.create(createPreInscripcionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las pre-inscripciones' })
  @ApiResponse({ status: 200, description: 'Lista de pre-inscripciones retornada exitosamente.' })
  findAll() {
    return this.preInscripcionesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una pre-inscripción por ID' })
  @ApiResponse({ status: 200, description: 'Pre-inscripción encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Pre-inscripción no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.preInscripcionesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una pre-inscripción existente' })
  @ApiResponse({ status: 200, description: 'Pre-inscripción actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Pre-inscripción no encontrada.' })
  update(@Param('id') id: string, @Body() updatePreInscripcionDto: UpdatePreInscripcionDto) {
    return this.preInscripcionesService.update(id, updatePreInscripcionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una pre-inscripción' })
  @ApiResponse({ status: 200, description: 'Pre-inscripción eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Pre-inscripción no encontrada.' })
  remove(@Param('id') id: string) {
    return this.preInscripcionesService.remove(id);
  }
}
