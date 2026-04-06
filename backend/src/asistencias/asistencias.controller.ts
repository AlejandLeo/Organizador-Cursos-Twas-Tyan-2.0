import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';

@ApiTags('asistencias')
@Controller('asistencias')
export class AsistenciasController {
  constructor(private readonly asistenciasService: AsistenciasService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva asistencia' })
  @ApiResponse({ status: 201, description: 'La asistencia ha sido registrada exitosamente.' })
  create(@Body() createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciasService.create(createAsistenciaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las asistencias' })
  @ApiResponse({ status: 200, description: 'Lista de asistencias retornada exitosamente.' })
  findAll() {
    return this.asistenciasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asistencia por ID' })
  @ApiResponse({ status: 200, description: 'Asistencia encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Asistencia no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.asistenciasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un registro de asistencia' })
  @ApiResponse({ status: 200, description: 'Asistencia actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Asistencia no encontrada.' })
  update(@Param('id') id: string, @Body() updateAsistenciaDto: UpdateAsistenciaDto) {
    return this.asistenciasService.update(id, updateAsistenciaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un registro de asistencia' })
  @ApiResponse({ status: 200, description: 'Asistencia eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Asistencia no encontrada.' })
  remove(@Param('id') id: string) {
    return this.asistenciasService.remove(id);
  }
}
