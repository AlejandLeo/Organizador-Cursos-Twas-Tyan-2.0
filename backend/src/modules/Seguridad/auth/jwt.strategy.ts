import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsuariosService } from '../../Usuario/usuarios/usuarios.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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

      const rolesActualizados = usuarioReal.usuariosRoles?.map(ur => ur.rol.nombre_rol) || [];

      return {
        id: payload.sub,
        email: payload.email,
        roles: rolesActualizados,
      };
    } catch (error) {
      throw new UnauthorizedException('El usuario ya no existe o no tiene acceso.');
    }
  }
}
