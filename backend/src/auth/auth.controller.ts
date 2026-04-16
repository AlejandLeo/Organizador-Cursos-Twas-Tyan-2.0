import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsuariosService } from 'src/usuarios/usuarios.service';
import { LoginDto } from 'src/usuarios/dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExtractJwt } from 'passport-jwt';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  POST /auth/login
  //  Verifica email + contraseña y devuelve el JWT de acceso.
  // ══════════════════════════════════════════════════════════
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    // 1. Valida credenciales (lanza 401 si son incorrectas o cuenta inactiva)
    const usuario = await this.usuariosService.login(loginDto);
    // 2. Genera y devuelve el access_token JWT
    return this.authService.generarToken(usuario);
  }

  // ══════════════════════════════════════════════════════════
  //  GET /auth/perfil  (alias: /auth/me)
  //  Ruta protegida: valida el JWT y devuelve los datos del
  //  usuario autenticado con sus roles (para decidir dashboard).
  // ══════════════════════════════════════════════════════════
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado (perfil)' })
  @Get('perfil')
  async perfil(@Request() req: any) {
    // req.user viene de JwtStrategy.validate() → { id, email, roles }
    return this.usuariosService.getPerfil(req.user.id);
  }

  // Alias /auth/me → mismo comportamiento que /auth/perfil
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alias de /perfil' })
  @Get('me')
  async me(@Request() req: any) {
    return this.usuariosService.getPerfil(req.user.id);
  }

  // ══════════════════════════════════════════════════════════
  //  POST /auth/logout
  //  Invalida el token desde el backend añadiéndolo a la
  //  blacklist. Cualquier request posterior con ese token
  //  recibirá 401 aunque el JWT no haya expirado.
  // ══════════════════════════════════════════════════════════
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión (invalidar token)' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Request() req: any) {
    // Extraemos el raw token del header Authorization
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token) {
      this.authService.logout(token);
    }
    return { mensaje: 'Sesión cerrada correctamente.' };
  }
}
