import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ImparticionesService } from './imparticiones.service';
import { CreateImparticionDto } from './dto/create-imparticion.dto';
import { UpdateImparticionDto } from './dto/update-imparticion.dto';

@ApiTags('imparticiones')
@Controller('imparticiones')
export class ImparticionesController {
  constructor(private readonly imparticionesService: ImparticionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva impartición' })
  @ApiResponse({ status: 201, description: 'La impartición ha sido creada exitosamente.' })
  create(@Body() createImparticionDto: CreateImparticionDto) {
    return this.imparticionesService.create(createImparticionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las imparticiones' })
  @ApiResponse({ status: 200, description: 'Lista de imparticiones retornada exitosamente.' })
  findAll() {
    return this.imparticionesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una impartición por ID' })
  @ApiResponse({ status: 200, description: 'Impartición encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Impartición no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.imparticionesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una impartición existente' })
  @ApiResponse({ status: 200, description: 'Impartición actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Impartición no encontrada.' })
  update(@Param('id') id: string, @Body() updateImparticionDto: UpdateImparticionDto) {
    return this.imparticionesService.update(id, updateImparticionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una impartición' })
  @ApiResponse({ status: 200, description: 'Impartición eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Impartición no encontrada.' })
  remove(@Param('id') id: string) {
    return this.imparticionesService.remove(id);
  }
}
