import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InscripcionesService } from './inscripciones.service';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';

@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Post()
  create(@Body() createInscripcionDto: CreateInscripcionDto) {
    return this.inscripcionesService.create(createInscripcionDto);
  }

  @Get()
  findAll() {
    return this.inscripcionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inscripcionesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInscripcionDto: UpdateInscripcionDto) {
    return this.inscripcionesService.update(id, updateInscripcionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inscripcionesService.remove(id);
  }
}
