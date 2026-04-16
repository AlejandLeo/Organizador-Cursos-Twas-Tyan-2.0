import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  /**
   * Lista negra de tokens invalidados por logout.
   */
  private readonly tokenBlacklist = new Set<string>();

  constructor(private readonly jwtService: JwtService) { }

  /**
   * Genera el JWT con el payload básico del usuario.
   * Incluye id, email y lista de nombres de roles.
   */
  async generarToken(usuario: any): Promise<{ access_token: string }> {
    const roles: string[] = usuario.usuariosRoles
      ? usuario.usuariosRoles
        .map((ur: any) => ur.rol?.nombre_rol)
        .filter(Boolean)
      : [];

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Invalida un token añadiéndolo a la lista negra.
   * La JwtStrategy rechazará cualquier request que lo incluya.
   */
  logout(token: string): void {
    this.tokenBlacklist.add(token);
  }

  /**
   * Comprueba si un token fue invalidado por logout.
   */
  isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }
}
