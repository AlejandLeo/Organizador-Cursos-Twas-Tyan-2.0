import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ActividadesAcademicasService } from './actividades-academicas.service';
import { ActividadAcademica } from './entities/actividad-academica.entity';

@Controller('actividades-academicas')
export class ActividadesAcademicasController {
  constructor(private readonly actividadesAcademicasService: ActividadesAcademicasService) {}

  @Post()
  create(@Body() data: Partial<ActividadAcademica>) {
    return this.actividadesAcademicasService.create(data);
  }

  @Get()
  findAll() {
    return this.actividadesAcademicasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesAcademicasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<ActividadAcademica>) {
    return this.actividadesAcademicasService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.actividadesAcademicasService.remove(id);
  }
}
