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
