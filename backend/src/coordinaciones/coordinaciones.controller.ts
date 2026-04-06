import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CoordinacionesService } from './coordinaciones.service';
import { CreateCoordinacionDto } from './dto/create-coordinacion.dto';
import { UpdateCoordinacionDto } from './dto/update-coordinacion.dto';

@ApiTags('coordinaciones')
@Controller('coordinaciones')
export class CoordinacionesController {
  constructor(private readonly coordinacionesService: CoordinacionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva coordinación' })
  @ApiResponse({ status: 201, description: 'La coordinación ha sido creada exitosamente.' })
  create(@Body() createCoordinacionDto: CreateCoordinacionDto) {
    return this.coordinacionesService.create(createCoordinacionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las coordinaciones' })
  @ApiResponse({ status: 200, description: 'Lista de coordinaciones retornada exitosamente.' })
  findAll() {
    return this.coordinacionesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una coordinación por ID' })
  @ApiResponse({ status: 200, description: 'Coordinación encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Coordinación no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.coordinacionesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una coordinación existente' })
  @ApiResponse({ status: 200, description: 'Coordinación actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Coordinación no encontrada.' })
  update(@Param('id') id: string, @Body() updateCoordinacionDto: UpdateCoordinacionDto) {
    return this.coordinacionesService.update(id, updateCoordinacionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una coordinación' })
  @ApiResponse({ status: 200, description: 'Coordinación eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Coordinación no encontrada.' })
  remove(@Param('id') id: string) {
    return this.coordinacionesService.remove(id);
  }
}
