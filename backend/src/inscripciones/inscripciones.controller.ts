import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';

@ApiTags('inscripciones')
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva inscripción' })
  @ApiResponse({ status: 201, description: 'La inscripción ha sido creada exitosamente.' })
  create(@Body() createInscripcionDto: CreateInscripcionDto) {
    return this.inscripcionesService.create(createInscripcionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las inscripciones' })
  @ApiResponse({ status: 200, description: 'Lista de inscripciones retornada exitosamente.' })
  findAll() {
    return this.inscripcionesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una inscripción por ID' })
  @ApiResponse({ status: 200, description: 'Inscripción encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.inscripcionesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una inscripción existente' })
  @ApiResponse({ status: 200, description: 'Inscripción actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada.' })
  update(@Param('id') id: string, @Body() updateInscripcionDto: UpdateInscripcionDto) {
    return this.inscripcionesService.update(id, updateInscripcionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una inscripción' })
  @ApiResponse({ status: 200, description: 'Inscripción eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Inscripción no encontrada.' })
  remove(@Param('id') id: string) {
    return this.inscripcionesService.remove(id);
  }
}
