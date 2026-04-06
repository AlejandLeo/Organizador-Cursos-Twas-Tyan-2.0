import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FirmasService } from './firmas.service';
import { CreateFirmaDto } from './dto/create-firma.dto';
import { UpdateFirmaDto } from './dto/update-firma.dto';

@ApiTags('firmas')
@Controller('firmas')
export class FirmasController {
  constructor(private readonly firmasService: FirmasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva firma' })
  @ApiResponse({ status: 201, description: 'La firma ha sido creada exitosamente.' })
  create(@Body() createFirmaDto: CreateFirmaDto) {
    return this.firmasService.create(createFirmaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las firmas' })
  @ApiResponse({ status: 200, description: 'Lista de firmas retornada exitosamente.' })
  findAll() {
    return this.firmasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una firma por ID' })
  @ApiResponse({ status: 200, description: 'Firma encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Firma no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.firmasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una firma existente' })
  @ApiResponse({ status: 200, description: 'Firma actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Firma no encontrada.' })
  update(@Param('id') id: string, @Body() updateFirmaDto: UpdateFirmaDto) {
    return this.firmasService.update(id, updateFirmaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una firma' })
  @ApiResponse({ status: 200, description: 'Firma eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Firma no encontrada.' })
  remove(@Param('id') id: string) {
    return this.firmasService.remove(id);
  }
}
