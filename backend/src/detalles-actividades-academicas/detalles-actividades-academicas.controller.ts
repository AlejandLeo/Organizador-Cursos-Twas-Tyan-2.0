import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DetallesActividadesAcademicasService } from './detalles-actividades-academicas.service';
import { CreateDetalleActividadAcademicaDto } from './dto/create-detalle-actividad-academica.dto';
import { UpdateDetalleActividadAcademicaDto } from './dto/update-detalle-actividad-academica.dto';

@ApiTags('detalles-actividades-academicas')
@Controller('detalles-actividades-academicas')
export class DetallesActividadesAcademicasController {
  constructor(private readonly detallesActividadesAcademicasService: DetallesActividadesAcademicasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo detalle de actividad académica' })
  @ApiResponse({ status: 201, description: 'El detalle de actividad académica ha sido creado exitosamente.' })
  create(@Body() createDetalleActividadAcademicaDto: CreateDetalleActividadAcademicaDto) {
    return this.detallesActividadesAcademicasService.create(createDetalleActividadAcademicaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los detalles de actividades académicas' })
  @ApiResponse({ status: 200, description: 'Lista de detalles de actividades académicas retornada exitosamente.' })
  findAll() {
    return this.detallesActividadesAcademicasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un detalle de actividad académica por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de actividad académica encontrado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Detalle de actividad académica no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.detallesActividadesAcademicasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un detalle de actividad académica existente' })
  @ApiResponse({ status: 200, description: 'Detalle de actividad académica actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Detalle de actividad académica no encontrado.' })
  update(@Param('id') id: string, @Body() updateDetalleActividadAcademicaDto: UpdateDetalleActividadAcademicaDto) {
    return this.detallesActividadesAcademicasService.update(id, updateDetalleActividadAcademicaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un detalle de actividad académica' })
  @ApiResponse({ status: 200, description: 'Detalle de actividad académica eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Detalle de actividad académica no encontrado.' })
  remove(@Param('id') id: string) {
    return this.detallesActividadesAcademicasService.remove(id);
  }
}
