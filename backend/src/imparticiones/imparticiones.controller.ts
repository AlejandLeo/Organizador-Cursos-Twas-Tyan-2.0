import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImparticionesService } from './imparticiones.service';
import { CreateImparticionDto } from './dto/create-imparticion.dto';
import { UpdateImparticionDto } from './dto/update-imparticion.dto';

@Controller('imparticiones')
export class ImparticionesController {
  constructor(private readonly imparticionesService: ImparticionesService) {}

  @Post()
  create(@Body() createImparticionDto: CreateImparticionDto) {
    return this.imparticionesService.create(createImparticionDto);
  }

  @Get()
  findAll() {
    return this.imparticionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imparticionesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImparticionDto: UpdateImparticionDto) {
    return this.imparticionesService.update(id, updateImparticionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imparticionesService.remove(id);
  }
}
