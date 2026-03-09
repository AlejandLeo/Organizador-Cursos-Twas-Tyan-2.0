import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsuariosRolesService } from './usuarios-roles.service';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';

@Controller('usuarios-roles')
export class UsuariosRolesController {
  constructor(private readonly usuariosRolesService: UsuariosRolesService) {}

  @Post()
  create(@Body() createUsuarioRolDto: CreateUsuarioRolDto) {
    return this.usuariosRolesService.create(createUsuarioRolDto);
  }

  @Get()
  findAll() {
    return this.usuariosRolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosRolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioRolDto: UpdateUsuarioRolDto) {
    return this.usuariosRolesService.update(id, updateUsuarioRolDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuariosRolesService.remove(id);
  }
}
