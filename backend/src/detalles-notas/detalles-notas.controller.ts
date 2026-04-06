import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DetallesNotasService } from './detalles-notas.service';
import { CreateDetalleNotaDto } from './dto/create-detalle-nota.dto';
import { UpdateDetalleNotaDto } from './dto/update-detalle-nota.dto';

@ApiTags('detalles-notas')
@Controller('detalles-notas')
export class DetallesNotasController {
  constructor(private readonly detallesNotasService: DetallesNotasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo detalle de nota' })
  @ApiResponse({ status: 201, description: 'El detalle de nota ha sido creado exitosamente.' })
  create(@Body() createDetalleNotaDto: CreateDetalleNotaDto) {
    return this.detallesNotasService.create(createDetalleNotaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los detalles de notas' })
  @ApiResponse({ status: 200, description: 'Lista de detalles de notas retornada exitosamente.' })
  findAll() {
    return this.detallesNotasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un detalle de nota por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de nota encontrado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Detalle de nota no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.detallesNotasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un detalle de nota existente' })
  @ApiResponse({ status: 200, description: 'Detalle de nota actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Detalle de nota no encontrado.' })
  update(@Param('id') id: string, @Body() updateDetalleNotaDto: UpdateDetalleNotaDto) {
    return this.detallesNotasService.update(id, updateDetalleNotaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un detalle de nota' })
  @ApiResponse({ status: 200, description: 'Detalle de nota eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Detalle de nota no encontrado.' })
  remove(@Param('id') id: string) {
    return this.detallesNotasService.remove(id);
  }
}
