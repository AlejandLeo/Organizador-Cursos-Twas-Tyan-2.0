import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CoordinacionesService } from './coordinaciones.service';
import { CreateCoordinacionDto } from './dto/create-coordinacion.dto';
import { UpdateCoordinacionDto } from './dto/update-coordinacion.dto';

@Controller('coordinaciones')
export class CoordinacionesController {
  constructor(private readonly coordinacionesService: CoordinacionesService) {}

  @Post()
  create(@Body() createCoordinacionDto: CreateCoordinacionDto) {
    return this.coordinacionesService.create(createCoordinacionDto);
  }

  @Get()
  findAll() {
    return this.coordinacionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coordinacionesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCoordinacionDto: UpdateCoordinacionDto) {
    return this.coordinacionesService.update(id, updateCoordinacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coordinacionesService.remove(id);
  }
}
