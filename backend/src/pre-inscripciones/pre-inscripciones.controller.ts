import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PreInscripcionesService } from './pre-inscripciones.service';
import { CreatePreInscripcionDto } from './dto/create-pre-inscripcion.dto';
import { UpdatePreInscripcionDto } from './dto/update-pre-inscripcion.dto';

@Controller('pre-inscripciones')
export class PreInscripcionesController {
  constructor(private readonly preInscripcionesService: PreInscripcionesService) {}

  @Post()
  create(@Body() createPreInscripcionDto: CreatePreInscripcionDto) {
    return this.preInscripcionesService.create(createPreInscripcionDto);
  }

  @Get()
  findAll() {
    return this.preInscripcionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.preInscripcionesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePreInscripcionDto: UpdatePreInscripcionDto) {
    return this.preInscripcionesService.update(id, updatePreInscripcionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.preInscripcionesService.remove(id);
  }
}
