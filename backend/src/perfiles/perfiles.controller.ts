import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PerfilesService } from './perfiles.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@ApiTags('perfiles')
@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo perfil' })
  @ApiResponse({ status: 201, description: 'El perfil ha sido creado exitosamente.' })
  create(@Body() createPerfilDto: CreatePerfilDto) {
    return this.perfilesService.create(createPerfilDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los perfiles' })
  @ApiResponse({ status: 200, description: 'Lista de perfiles retornada exitosamente.' })
  findAll() {
    return this.perfilesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un perfil por ID' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.perfilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un perfil existente' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
  update(@Param('id') id: string, @Body() updatePerfilDto: UpdatePerfilDto) {
    return this.perfilesService.update(id, updatePerfilDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un perfil' })
  @ApiResponse({ status: 200, description: 'Perfil eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado.' })
  remove(@Param('id') id: string) {
    return this.perfilesService.remove(id);
  }
}
