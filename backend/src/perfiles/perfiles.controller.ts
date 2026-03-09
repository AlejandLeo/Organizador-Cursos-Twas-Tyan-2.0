import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PerfilesService } from './perfiles.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Post()
  create(@Body() createPerfilDto: CreatePerfilDto) {
    return this.perfilesService.create(createPerfilDto);
  }

  @Get()
  findAll() {
    return this.perfilesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.perfilesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePerfilDto: UpdatePerfilDto) {
    return this.perfilesService.update(id, updatePerfilDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.perfilesService.remove(id);
  }
}
