import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DetallesActividadesAcademicasService } from './detalles-actividades-academicas.service';
import { CreateDetalleActividadAcademicaDto } from './dto/create-detalle-actividad-academica.dto';
import { UpdateDetalleActividadAcademicaDto } from './dto/update-detalle-actividad-academica.dto';

@Controller('detalles-actividades-academicas')
export class DetallesActividadesAcademicasController {
  constructor(private readonly detallesActividadesAcademicasService: DetallesActividadesAcademicasService) {}

  @Post()
  create(@Body() createDetalleActividadAcademicaDto: CreateDetalleActividadAcademicaDto) {
    return this.detallesActividadesAcademicasService.create(createDetalleActividadAcademicaDto);
  }

  @Get()
  findAll() {
    return this.detallesActividadesAcademicasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.detallesActividadesAcademicasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDetalleActividadAcademicaDto: UpdateDetalleActividadAcademicaDto) {
    return this.detallesActividadesAcademicasService.update(id, updateDetalleActividadAcademicaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detallesActividadesAcademicasService.remove(id);
  }
}
