import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { CreateSesionAcademicaDto } from './dto/create-sesion-academica.dto';
import { UpdateSesionAcademicaDto } from './dto/update-sesion-academica.dto';

@ApiTags('sesiones-academicas')
@Controller('sesiones-academicas')
export class SesionesAcademicasController {
  constructor(private readonly sesionesAcademicasService: SesionesAcademicasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva sesión académica' })
  @ApiResponse({ status: 201, description: 'La sesión académica ha sido creada exitosamente.' })
  create(@Body() createSesionAcademicaDto: CreateSesionAcademicaDto) {
    return this.sesionesAcademicasService.create(createSesionAcademicaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las sesiones académicas' })
  @ApiResponse({ status: 200, description: 'Lista de sesiones retornada exitosamente.' })
  findAll() {
    return this.sesionesAcademicasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una sesión académica por ID' })
  @ApiResponse({ status: 200, description: 'Sesión académica encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Sesión académica no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.sesionesAcademicasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una sesión académica existente' })
  @ApiResponse({ status: 200, description: 'Sesión académica actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Sesión académica no encontrada.' })
  update(@Param('id') id: string, @Body() updateSesionAcademicaDto: UpdateSesionAcademicaDto) {
    return this.sesionesAcademicasService.update(id, updateSesionAcademicaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una sesión académica' })
  @ApiResponse({ status: 200, description: 'Sesión académica eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Sesión académica no encontrada.' })
  remove(@Param('id') id: string) {
    return this.sesionesAcademicasService.remove(id);
  }
}
