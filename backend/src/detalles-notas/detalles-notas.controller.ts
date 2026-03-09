import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DetallesNotasService } from './detalles-notas.service';
import { CreateDetalleNotaDto } from './dto/create-detalle-nota.dto';
import { UpdateDetalleNotaDto } from './dto/update-detalle-nota.dto';

@Controller('detalles-notas')
export class DetallesNotasController {
  constructor(private readonly detallesNotasService: DetallesNotasService) {}

  @Post()
  create(@Body() createDetalleNotaDto: CreateDetalleNotaDto) {
    return this.detallesNotasService.create(createDetalleNotaDto);
  }

  @Get()
  findAll() {
    return this.detallesNotasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.detallesNotasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDetalleNotaDto: UpdateDetalleNotaDto) {
    return this.detallesNotasService.update(id, updateDetalleNotaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detallesNotasService.remove(id);
  }
}
