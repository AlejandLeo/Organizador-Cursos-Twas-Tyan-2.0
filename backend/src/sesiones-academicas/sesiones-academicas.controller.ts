import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { SesionAcademica } from './entities/sesion-academica.entity';

@Controller('sesiones-academicas')
export class SesionesAcademicasController {
  constructor(private readonly sesionesAcademicasService: SesionesAcademicasService) {}

  @Post()
  create(@Body() data: Partial<SesionAcademica>) {
    return this.sesionesAcademicasService.create(data);
  }

  @Get()
  findAll() {
    return this.sesionesAcademicasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sesionesAcademicasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<SesionAcademica>) {
    return this.sesionesAcademicasService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sesionesAcademicasService.remove(id);
  }
}
