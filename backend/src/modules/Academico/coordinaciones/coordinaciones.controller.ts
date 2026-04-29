import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CoordinacionesService } from './coordinaciones.service';
import { CoordinacionEvento } from './entities/coordinacion.entity';

@Controller('coordinaciones')
export class CoordinacionesController {
  constructor(private readonly coordinacionesService: CoordinacionesService) {}

  @Post()
  create(@Body() data: Partial<CoordinacionEvento>) {
    return this.coordinacionesService.create(data);
  }

  @Get()
  findAll() {
    return this.coordinacionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coordinacionesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<CoordinacionEvento>,
  ) {
    return this.coordinacionesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coordinacionesService.remove(id);
  }
}
