import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActividadesAcademicasService } from './actividades-academicas.service';
import { CreateActividadAcademicaDto } from './dto/create-actividad-academica.dto';
import { UpdateActividadAcademicaDto } from './dto/update-actividad-academica.dto';

@Controller('actividades-academicas')
export class ActividadesAcademicasController {
  constructor(private readonly actividadesAcademicasService: ActividadesAcademicasService) {}

  @Post()
  create(@Body() createActividadAcademicaDto: CreateActividadAcademicaDto) {
    return this.actividadesAcademicasService.create(createActividadAcademicaDto);
  }

  @Get()
  findAll() {
    return this.actividadesAcademicasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actividadesAcademicasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActividadAcademicaDto: UpdateActividadAcademicaDto) {
    return this.actividadesAcademicasService.update(id, updateActividadAcademicaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.actividadesAcademicasService.remove(id);
  }
}
