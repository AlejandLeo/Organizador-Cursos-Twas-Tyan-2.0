import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotasService } from './notas.service';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';

@ApiTags('notas')
@Controller('notas')
export class NotasController {
  constructor(private readonly notasService: NotasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva nota' })
  @ApiResponse({ status: 201, description: 'La nota ha sido creada exitosamente.' })
  create(@Body() createNotaDto: CreateNotaDto) {
    return this.notasService.create(createNotaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las notas' })
  @ApiResponse({ status: 200, description: 'Lista de notas retornada exitosamente.' })
  findAll() {
    return this.notasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una nota por ID' })
  @ApiResponse({ status: 200, description: 'Nota encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Nota no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.notasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una nota existente' })
  @ApiResponse({ status: 200, description: 'Nota actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Nota no encontrada.' })
  update(@Param('id') id: string, @Body() updateNotaDto: UpdateNotaDto) {
    return this.notasService.update(id, updateNotaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una nota' })
  @ApiResponse({ status: 200, description: 'Nota eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Nota no encontrada.' })
  remove(@Param('id') id: string) {
    return this.notasService.remove(id);
  }
}
