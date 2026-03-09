import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VersionesEventosService } from './versiones-eventos.service';
import { CreateVersionEventoDto } from './dto/create-version-evento.dto';
import { UpdateVersionEventoDto } from './dto/update-version-evento.dto';

@Controller('versiones-eventos')
export class VersionesEventosController {
  constructor(private readonly versionesEventosService: VersionesEventosService) {}

  @Post()
  create(@Body() createVersionEventoDto: CreateVersionEventoDto) {
    return this.versionesEventosService.create(createVersionEventoDto);
  }

  @Get()
  findAll() {
    return this.versionesEventosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.versionesEventosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVersionEventoDto: UpdateVersionEventoDto) {
    return this.versionesEventosService.update(id, updateVersionEventoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.versionesEventosService.remove(id);
  }
}
