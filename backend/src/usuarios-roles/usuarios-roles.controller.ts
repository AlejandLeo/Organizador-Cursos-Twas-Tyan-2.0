import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsuariosRolesService } from './usuarios-roles.service';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';

@ApiTags('usuarios-roles')
@Controller('usuarios-roles')
export class UsuariosRolesController {
  constructor(private readonly usuariosRolesService: UsuariosRolesService) {}

  @Post()
  @ApiOperation({ summary: 'Asignar un rol a un usuario' })
  @ApiResponse({ status: 201, description: 'El rol ha sido asignado exitosamente.' })
  create(@Body() createUsuarioRolDto: CreateUsuarioRolDto) {
    return this.usuariosRolesService.create(createUsuarioRolDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las asignaciones de roles' })
  @ApiResponse({ status: 200, description: 'Lista de asignaciones retornada exitosamente.' })
  findAll() {
    return this.usuariosRolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una asignación de rol por ID' })
  @ApiResponse({ status: 200, description: 'Asignación encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.usuariosRolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una asignación de rol existente' })
  @ApiResponse({ status: 200, description: 'Asignación actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada.' })
  update(@Param('id') id: string, @Body() updateUsuarioRolDto: UpdateUsuarioRolDto) {
    return this.usuariosRolesService.update(id, updateUsuarioRolDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una asignación de rol' })
  @ApiResponse({ status: 200, description: 'Asignación eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada.' })
  remove(@Param('id') id: string) {
    return this.usuariosRolesService.remove(id);
  }
}
