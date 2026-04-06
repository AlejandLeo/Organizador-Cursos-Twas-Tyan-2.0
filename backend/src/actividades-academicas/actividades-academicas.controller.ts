import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ActividadesAcademicasService } from './actividades-academicas.service';
import { CreateActividadAcademicaDto } from './dto/create-actividad-academica.dto';
import { UpdateActividadAcademicaDto } from './dto/update-actividad-academica.dto';

@ApiTags('actividades-academicas')
@Controller('actividades-academicas')
export class ActividadesAcademicasController {
  constructor(private readonly actividadesAcademicasService: ActividadesAcademicasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva actividad académica' })
  @ApiResponse({ status: 201, description: 'La actividad académica ha sido creada exitosamente.' })
  create(@Body() createActividadAcademicaDto: CreateActividadAcademicaDto) {
    return this.actividadesAcademicasService.create(createActividadAcademicaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las actividades académicas' })
  @ApiResponse({ status: 200, description: 'Lista de actividades académicas retornada exitosamente.' })
  findAll() {
    return this.actividadesAcademicasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una actividad académica por ID' })
  @ApiResponse({ status: 200, description: 'Actividad académica encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Actividad académica no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.actividadesAcademicasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una actividad académica existente' })
  @ApiResponse({ status: 200, description: 'Actividad académica actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Actividad académica no encontrada.' })
  update(@Param('id') id: string, @Body() updateActividadAcademicaDto: UpdateActividadAcademicaDto) {
    return this.actividadesAcademicasService.update(id, updateActividadAcademicaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una actividad académica' })
  @ApiResponse({ status: 200, description: 'Actividad académica eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Actividad académica no encontrada.' })
  remove(@Param('id') id: string) {
    return this.actividadesAcademicasService.remove(id);
  }
}
