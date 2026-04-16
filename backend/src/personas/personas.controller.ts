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
import { PersonasService } from './personas.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  /**
   * POST /personas
   * Crea un perfil de persona independiente.
   */
  @Post()
  create(@Body() dto: CreatePersonaDto) {
    return this.personasService.create(dto);
  }

  /**
   * GET /personas
   * Lista todos los perfiles con su usuario vinculado (JOIN).
   */
  @Get()
  findAll() {
    return this.personasService.findAll();
  }

  /**
   * GET /personas/:id
   * Ver perfil por id_perfil. Incluye usuario + roles del usuario.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personasService.findOne(id);
  }

  /**
   * GET /personas/usuario/:idUsuario
   * Busca la persona asociada a un usuario por id_usuario.
   * Ejemplo de join inverso: buscamos en personas filtrando por su FK.
   */
  @Get('usuario/:idUsuario')
  findByUsuario(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.personasService.findByUsuario(idUsuario);
  }

  /**
   * PATCH /personas/:id
   * Actualiza datos personales (nombre, DNI, celular, etc.).
   */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePersonaDto) {
    return this.personasService.update(id, dto);
  }

  /**
   * DELETE /personas/:id
   * Elimina un perfil de persona.
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.personasService.remove(id);
  }
}
