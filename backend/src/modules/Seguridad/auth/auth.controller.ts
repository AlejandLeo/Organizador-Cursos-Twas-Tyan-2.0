import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsuariosService } from '../../Usuario/usuarios/usuarios.service';
import { LoginDto } from '../../Usuario/usuarios/dto/login.dto';
import { RegisterDto } from '../../Usuario/usuarios/dto/register.dto';
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
    // 1. Valida credenciales
    const result = await this.usuariosService.login(loginDto);
    // 2. Genera y devuelve el access_token JWT
    const token = await this.authService.generarToken(result);
    return {
      user: result,
      token: token.access_token,
      rolSugerido: result.rolSugerido // Lo exponemos directamente aquí
    };
  }

  @Post('register')
  @ApiOperation({
    summary:
      'Registro unificado (Persona + Usuario + Rol + Afiliación) y login automático',
  })
  async register(@Body() registerDto: RegisterDto) {
    // 1. Crea todo en una sola transacción
    const usuario = await this.usuariosService.register(registerDto);
    // 2. Genera token de inmediato
    const token = await this.authService.generarToken(usuario);
    // 3. Devuelve ambos
    return {
      usuario,
      ...token,
    };
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
    // req.user viene de JwtStrategy.validate() → { id, email, roles }
    return this.usuariosService.getPerfil(req.user.id);
  }

  // ══════════════════════════════════════════════════════════
  //  GET /auth/whoami  — DIAGNÓSTICO DE SESIÓN
  //  Devuelve exactamente lo que req.user contiene tras validar
  //  el JWT. Útil para depurar problemas de roles/403.
  // ══════════════════════════════════════════════════════════
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug: devuelve el payload de sesión validado (req.user)' })
  @Get('whoami')
  async whoami(@Request() req: any) {
    return {
      jwt_user: req.user,   // → { id, email, roles: [...] }
      perfil: await this.usuariosService.getPerfil(req.user.id),
    };
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

  // ══════════════════════════════════════════════════════════
  //  POST /auth/forgot-password
  //  Genera un token de recuperación de contraseña válido por
  //  1 hora. En producción este token se envía por correo;
  //  aquí lo devolvemos directamente para que el frontend
  //  pueda consumirlo sin necesidad de configurar SMTP.
  // ══════════════════════════════════════════════════════════
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña (retorna token de reset)',
  })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('El campo email es requerido.');
    }

    // Buscar el usuario sin lanzar excepción si no existe (para no revelar emails)
    const usuario = await this.usuariosService.findOptionalByEmail(email);

    if (!usuario) {
      // Retornamos el mismo mensaje para no revelar si el email está registrado
      return {
        mensaje:
          'Si el correo está registrado, recibirás instrucciones de recuperación.',
      };
    }

    const resetToken = this.authService.generarResetToken(email);

    // En un entorno de producción aquí se enviaría el correo con el token.
    // Como el módulo de email no está configurado, el token se devuelve directamente
    // para que el frontend lo consuma desde el flujo de recuperación.
    return {
      mensaje:
        'Token de recuperación generado. Úsalo en POST /auth/reset-password.',
      reset_token: resetToken,
    };
  }

  // ══════════════════════════════════════════════════════════
  //  POST /auth/reset-password
  //  Valida el token de reset (firmado por el servidor, expira
  //  en 1h) y cambia la contraseña del usuario. El token solo
  //  puede usarse para reset (campo tipo='reset' en el payload).
  // ══════════════════════════════════════════════════════════
  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer contraseña con token de recuperación',
  })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('nueva_password') nuevaPassword: string,
  ) {
    if (!token || !nuevaPassword) {
      throw new BadRequestException(
        'Los campos token y nueva_password son requeridos.',
      );
    }

    if (nuevaPassword.length < 6) {
      throw new BadRequestException(
        'La nueva contraseña debe tener al menos 6 caracteres.',
      );
    }

    // 1. Validar el token (lanza Error si expiró o es inválido)
    let email: string;
    try {
      email = this.authService.validarResetToken(token);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }

    // 2. Buscar usuario por email
    const usuario = await this.usuariosService.findOptionalByEmail(email);
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    // 3. Actualizar contraseña usando el servicio de usuarios (hashea bcrypt)
    await this.usuariosService.forzarCambioPassword(usuario.id, nuevaPassword);

    return { mensaje: 'Contraseña actualizada correctamente.' };
  }
}
