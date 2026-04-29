import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guardia JWT reutilizable.
 *
 * Uso:
 *   @UseGuards(JwtAuthGuard)
 *
 * Protege rutas exigiendo un Bearer token válido en el header Authorization.
 * El payload decodificado queda disponible en `req.user` con la forma:
 *   { id, email, roles }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
