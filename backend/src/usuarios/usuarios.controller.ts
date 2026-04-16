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
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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
  register(@Body() registerDto: RegisterDto) {
    return this.usuariosService.register(registerDto);
  }

  /**
   * PATCH /usuarios/:id/password
   * Cambia la contraseña verificando la contraseña actual.
   * La nueva contraseña se hashea antes de guardar.
   */
  @Patch(':id/password')
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
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  /**
   * GET /usuarios
   * Lista usuarios activos por defecto.
   * ?soloActivos=false → incluye también usuarios inactivos (uso administrativo).
   * La contraseña NUNCA se incluye en la respuesta.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('soloActivos') soloActivos: string) {
    // Si el query param existe y es exactamente 'false', muestra todos
    const filtrar = soloActivos !== 'false';
    return this.usuariosService.findAll(filtrar);
  }

  /**
   * GET /usuarios/:id
   * Busca un usuario por ID. Incluye persona + roles asignados.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  /**
   * GET /usuarios/:id/perfil
   * Perfil completo: usuario + persona + roles + afiliaciones.
   * Ejemplo de endpoint que hace join con múltiples tablas.
   */
  @Get(':id/perfil')
  getPerfil(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.getPerfil(id);
  }

  /**
   * PATCH /usuarios/:id
   * Actualiza email y/o estado. No permite cambio de password por aquí
   * (usar PATCH /usuarios/:id/password).
   */
  @Patch(':id')
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
