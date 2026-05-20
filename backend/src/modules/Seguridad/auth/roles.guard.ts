import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener los roles requeridos para la ruta usando el Reflector
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Si la ruta no tiene el decorador @Roles, se permite el acceso por defecto
    // (o podrías cambiarlo para que sea denegado por defecto según tu política).
    if (!requiredRoles) {
      return true;
    }

    // 3. Obtener el usuario del request (inyectado por el JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();
    const userRolesNormalized = (user?.roles || []).map((r: string) => r.toLowerCase());

    try {
      const logFile = path.join(process.cwd(), 'upload_debug.log');
      const logMsg = `[RolesGuard] URL: ${context.switchToHttp().getRequest().url} | User: ${JSON.stringify(user)} | Normalized Roles: ${JSON.stringify(userRolesNormalized)} | Required: ${JSON.stringify(requiredRoles)}\n`;
      fs.appendFileSync(logFile, logMsg);
    } catch (e) {}
    
    console.log('[RolesGuard] User inside request:', user);
    console.log('[RolesGuard] Required roles:', requiredRoles);

    // 4. EL PASE MAESTRO: Si es Super Usuario (insensitivo a mayúsculas) o es la cuenta admin maestra, tiene acceso total a todo
    if (userRolesNormalized.includes('super usuario') || user?.email === 'admin@tyan.org') {
      return true;
    }

    // 5. Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRole = requiredRoles.some((role) => userRolesNormalized.includes(role.toLowerCase()));
    console.log('[RolesGuard] Decision:', hasRole);
    return hasRole;
  }
}
