import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { CrearPonenteDto } from './dto/crear-ponente.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // ══════════════════════════════════════════════════════════
  //  AUTH
  // POST /usuarios/login            → Iniciar sesión
  // POST /usuarios/registro         → Registro completo (usuario + persona)
  // PATCH /usuarios/:id/password    → Cambiar contraseña
  // ══════════════════════════════════════════════════════════

  /**
   * POST /usuarios/registro
   * Crea un usuario Y su persona en una sola transacción atómica.
   * Si algo falla, se hace rollback completo (no quedan datos a medias).
   */
  @Post('registro')
  @ApiOperation({ summary: 'Registro completo (Usuario + Persona)' })
  register(@Body() registerDto: RegisterDto) {
    return this.usuariosService.register(registerDto);
  }

  /**
   * PATCH /usuarios/:id/password
   * Cambia la contraseña verificando la contraseña actual.
   * La nueva contraseña se hashea antes de guardar.
   */
  @Patch(':id/password')
  @ApiOperation({ summary: 'Cambiar contraseña de un usuario' })
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usuariosService.changePassword(id, changePasswordDto);
  }

  // ══════════════════════════════════════════════════════════
  //  CRUD BÁSICO
  // POST /usuarios          → Crear usuario simple (solo credenciales)
  // GET  /usuarios          → Listar todos (con perfil de persona)
  // GET  /usuarios/:id      → Ver uno por ID (con persona y roles)
  // PATCH /usuarios/:id     → Actualizar email/estado
  // DELETE /usuarios/:id    → Eliminar
  // ══════════════════════════════════════════════════════════

  /**
   * POST /usuarios
   * Crea solo las credenciales (sin perfil). Hashea la contraseña automáticamente.
   */
  @Post()
  @ApiOperation({ summary: 'Crear usuario simple (solo credenciales)' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  /**
   * GET /usuarios
   * Usa FiltrarUsuariosDto para soportar ?rol=, ?q=, ?page=, ?limit=, ?soloActivos=
   * Si el coordinador pasa filtros → llama findConFiltros.
   * Si no hay filtros → comportamiento anterior (findAll).
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar usuarios (con filtros y paginación)' })
  findAll(@Query() filtros: FiltrarUsuariosDto) {
    // Si viene algún filtro de coordinador, usar la versión enriquecida
    if (filtros.rol || filtros.q || filtros.page || filtros.limit) {
      return this.usuariosService.findConFiltros(filtros);
    }
    const filtrar = filtros.soloActivos !== 'false';
    return this.usuariosService.findAll(filtrar);
  }

  /**
   * GET /usuarios/:id
   * Busca un usuario por ID. Incluye persona + roles asignados.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  /**
   * GET /usuarios/:id/perfil
   * Perfil completo: usuario + persona + roles + afiliaciones.
   * Ejemplo de endpoint que hace join con múltiples tablas.
   */
  @Get(':id/perfil')
  @ApiOperation({ summary: 'Obtener perfil detallado de un usuario' })
  getPerfil(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.getPerfil(id);
  }

  /**
   * PATCH /usuarios/:id
   * Actualiza email y/o estado. No permite cambio de password por aquí
   * (usar PATCH /usuarios/:id/password).
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar email/estado de un usuario' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  /**
   * DELETE /usuarios/:id
   * Elimina el usuario. La persona se elimina en cascada (definido en la entidad).
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }

  // ══════════════════════════════════════════════════════════
  //  GESTIÓN DE ROLES
  // ══════════════════════════════════════════════════════════

  /**
   * POST /usuarios/:id/roles
   * Asigna un rol adicional a un usuario.
   * Solo accesible por el Super Usuario o Admin.
   */
  @Roles('Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post(':id/roles')
  @ApiOperation({
    summary: 'Asignar un rol adicional a un usuario (Solo Admin)',
  })
  async asignarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body('rolId', ParseIntPipe) rolId: number,
  ) {
    return this.usuariosService.asignarRol(id, rolId);
  }

  // ══════════════════════════════════════════════════════════
  //  ENDPOINTS COORDINADOR
  // ══════════════════════════════════════════════════════════

  /**
   * POST /usuarios/ponente
   * Crea un ponente completo (credenciales + persona + rol Ponente).
   * Solo accesible por Coordinador o Super Usuario.
   */
  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('ponente')
  @ApiOperation({ summary: 'Crear un ponente directamente (Coord/Admin)' })
  crearPonente(@Body() dto: CrearPonenteDto) {
    return this.usuariosService.crearPonente(dto);
  }

  /**
   * DELETE /usuarios/:id
   * Deshabilita el usuario (estado=0). No elimina físicamente.
   * Solo accesible por Coordinador o Super Usuario.
   */
  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Deshabilitar usuario (Coord/Admin)' })
  deshabilitarUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.deshabilitarUsuario(id);
  }
}
