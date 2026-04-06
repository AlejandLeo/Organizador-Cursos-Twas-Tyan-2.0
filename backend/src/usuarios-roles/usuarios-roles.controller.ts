import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { UsuariosRolesService } from './usuarios-roles.service';
import { UsuarioRol } from './entities/usuario-rol.entity';

@Controller('usuarios-roles')
export class UsuariosRolesController {
  constructor(private readonly usuariosRolesService: UsuariosRolesService) {}

  @Post()
  create(@Body() data: Partial<UsuarioRol>) {
    return this.usuariosRolesService.create(data);
  }

  @Get()
  findAll() {
    return this.usuariosRolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosRolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<UsuarioRol>) {
    return this.usuariosRolesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosRolesService.remove(id);
  }
}
