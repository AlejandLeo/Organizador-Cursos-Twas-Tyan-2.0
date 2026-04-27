import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  /**
   * Lista negra de tokens invalidados por logout.
   */
  private readonly tokenBlacklist = new Set<string>();

  constructor(private readonly jwtService: JwtService) {}

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

  // ══════════════════════════════════════════════════════════
  //  RECUPERACIÓN DE CONTRASEÑA
  // ══════════════════════════════════════════════════════════

  /**
   * Genera un JWT de corta duración (1 hora) para reset de contraseña.
   * El payload incluye el email y el campo tipo='reset' para distinguirlo
   * de un access token normal y evitar su reutilización como autenticación.
   */
  generarResetToken(email: string): string {
    const payload = { email, tipo: 'reset' };
    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }

  /**
   * Valida el token de reset de contraseña.
   * Lanza un Error descriptivo si el token expiró, tiene firma inválida
   * o si el campo 'tipo' no es 'reset'.
   * Retorna el email embebido en el payload para buscar al usuario.
   */
  validarResetToken(token: string): string {
    try {
      const payload = this.jwtService.verify(token) as {
        email: string;
        tipo: string;
      };
      if (payload.tipo !== 'reset') {
        throw new Error('Token inválido para reset de contraseña.');
      }
      return payload.email;
    } catch {
      throw new Error('Token de recuperación inválido o expirado.');
    }
  }
}
