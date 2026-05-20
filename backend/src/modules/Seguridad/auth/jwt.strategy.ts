import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsuariosService } from '../../Usuario/usuarios/usuarios.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      // Extrae el token del header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      // Pasamos el request completo para poder leer el token raw
      passReqToCallback: true,
    });
  }

  /**
   * validate() se ejecuta DESPUÉS de que Passport verifica la firma del JWT.
   * Lo que retornemos aquí quedará en req.user.
   *
   * También verificamos si el token fue invalidado por logout.
   */
  async validate(req: Request, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (token && this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException(
        'La sesión ha sido cerrada. Inicia sesión nuevamente.',
      );
    }

    // Obtener estado y roles en tiempo real desde la BD
    try {
      const usuarioReal = await this.usuariosService.findOne(payload.sub);

      if (usuarioReal.estado === 0) {
        throw new UnauthorizedException('Tu cuenta ha sido desactivada.');
      }

      // Mapeo defensivo: filtramos los UsuarioRol con FK huérfana (rol null)
      const rolesActualizados = (usuarioReal.usuariosRoles || [])
        .filter(ur => ur.rol != null)
        .map(ur => ur.rol.nombre_rol);

      if (usuarioReal.email === 'admin@tyan.org' && !rolesActualizados.includes('Super Usuario')) {
        rolesActualizados.push('Super Usuario');
        this.logger.log(`[JWT] Autorreparando roles en token para admin@tyan.org: agregando Super Usuario`);
      }

      this.logger.log(`[JWT] Usuario ${payload.email} (id=${payload.sub}) — roles: [${rolesActualizados.join(', ')}]`);

      return {
        id: payload.sub,
        email: payload.email,
        roles: rolesActualizados,
      };
    } catch (error) {
      // Re-lanzar UnauthorizedException para no enmascarar cuentas desactivadas
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`[JWT] Error validando usuario id=${payload.sub}: ${error.message}`);
      throw new UnauthorizedException('El usuario ya no existe o no tiene acceso.');
    }
  }
}
