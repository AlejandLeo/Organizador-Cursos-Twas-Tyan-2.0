import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { InscripcionesService } from './inscripciones.service';
import { Inscripcion } from './entities/inscripcion.entity';

@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post()
  create(@Body() data: Partial<Inscripcion>) {
    return this.inscripcionesService.create(data);
  }

  @Get()
  findAll() {
    return this.inscripcionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<Inscripcion>) {
    return this.inscripcionesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inscripcionesService.remove(id);
  }
}
