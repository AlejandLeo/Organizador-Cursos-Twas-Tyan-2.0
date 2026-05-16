import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

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

    // 4. EL PASE MAESTRO: Si es Super Usuario, tiene acceso total a todo
    if (user.roles?.includes('Super Usuario')) {
      return true;
    }

    // 5. Verificar si el usuario tiene al menos uno de los roles requeridos
    const userRolesNormalized = (user.roles || []).map((r: string) => r.toLowerCase());
    return requiredRoles.some((role) => userRolesNormalized.includes(role.toLowerCase()));
  }
}
