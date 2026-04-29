import { SetMetadata } from '@nestjs/common';

/**
 * Decorador @Roles('admin', 'coordinador', ...)
 * Permite marcar qué roles tienen acceso a un controlador o método.
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
