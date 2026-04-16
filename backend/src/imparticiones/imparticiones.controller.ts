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
import { ImparticionesService } from './imparticiones.service';
import { Imparticion } from './entities/imparticion.entity';

@Controller('imparticiones')
export class ImparticionesController {
  constructor(private readonly imparticionesService: ImparticionesService) {}

  @Post()
  create(@Body() data: Partial<Imparticion>) {
    return this.imparticionesService.create(data);
  }

  @Get()
  findAll() {
    return this.imparticionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.imparticionesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Imparticion>,
  ) {
    return this.imparticionesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.imparticionesService.remove(id);
  }
}
