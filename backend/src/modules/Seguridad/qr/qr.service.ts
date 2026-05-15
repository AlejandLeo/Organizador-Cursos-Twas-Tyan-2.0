import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class QrService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Genera un token de asistencia para el usuario.
   * Expira en 15 minutos.
   */
  async generarTokenAsistencia(usuarioId: number): Promise<string> {
    const payload = {
      sub: usuarioId,
      tipo: 'asistencia',
      timestamp: Date.now(),
    };
    
    return this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
  }

  /**
   * Genera un token QR dinámico para el estudiante.
   * Contiene su ID y el propósito.
   */
  generarTokenEstudiante(id_usuario: number): string {
    const payload = {
      sub: id_usuario,
      tipo: 'qr_estudiante',
    };
    return this.jwtService.sign(payload, { expiresIn: '5m' });
  }

  /**
   * Genera un token QR dinámico para la sesión académica.
   * Contiene el ID de la sesión y expira rápidamente.
   */
  generarTokenSesion(id_sesion: number): string {
    const payload = {
      sub: id_sesion,
      tipo: 'qr_sesion',
    };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  /**
   * Verifica la validez y contenido de un token QR.
   */
  verificarTokenQr(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Valida un token de asistencia y devuelve el usuarioId.
   */
  async validarTokenAsistencia(token: string): Promise<number> {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.tipo !== 'asistencia') {
        throw new UnauthorizedException('Token inválido para asistencia.');
      }
      
      return payload.sub;
    } catch (error) {
      throw new UnauthorizedException('El código QR ha expirado o es inválido.');
    }
  }
}
