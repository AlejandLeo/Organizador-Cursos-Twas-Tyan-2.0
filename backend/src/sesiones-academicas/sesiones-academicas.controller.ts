import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { CreateSesionAcademicaDto } from './dto/create-sesion-academica.dto';
import { UpdateSesionAcademicaDto } from './dto/update-sesion-academica.dto';

@Controller('sesiones-academicas')
export class SesionesAcademicasController {
  constructor(private readonly sesionesAcademicasService: SesionesAcademicasService) {}

  @Post()
  create(@Body() createSesionAcademicaDto: CreateSesionAcademicaDto) {
    return this.sesionesAcademicasService.create(createSesionAcademicaDto);
  }

  @Get()
  findAll() {
    return this.sesionesAcademicasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sesionesAcademicasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSesionAcademicaDto: UpdateSesionAcademicaDto) {
    return this.sesionesAcademicasService.update(id, updateSesionAcademicaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sesionesAcademicasService.remove(id);
  }
}
