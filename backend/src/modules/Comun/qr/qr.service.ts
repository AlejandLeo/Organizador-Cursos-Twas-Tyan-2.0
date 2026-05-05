import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class QrService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Genera un token QR dinámico para el estudiante.
   * Contiene su ID y el propósito.
   */
  generarTokenEstudiante(id_usuario: number): string {
    const payload = {
      sub: id_usuario,
      tipo: 'qr_estudiante',
    };
    // El estudiante muestra este QR, expira en 5 minutos para evitar capturas.
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
    // El docente proyecta este QR, expira en 15 minutos para evitar que
    // los alumnos le tomen foto y lo pasen. El frontend del docente lo recarga.
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
}
