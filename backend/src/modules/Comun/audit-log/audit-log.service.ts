import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /**
   * Crear un registro de auditoría.
   */
  async registrar(data: {
    modulo: string;
    accion: string;
    descripcion: string;
    usuario: string;
    entidad_id?: string;
    entidad_nombre?: string;
    cambios?: any;
    metadatos?: any;
  }): Promise<AuditLog> {
    const log = this.repo.create(data);
    return this.repo.save(log);
  }

  /**
   * Listar registros con paginación, filtros y búsqueda.
   */
  async listar(query: {
    page?: number;
    limit?: number;
    modulo?: string;
    accion?: string;
    busqueda?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 15));
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('log');

    // Filtro por módulo
    if (query.modulo) {
      qb.andWhere('log.modulo = :modulo', { modulo: query.modulo });
    }

    // Filtro por acción
    if (query.accion) {
      qb.andWhere('log.accion = :accion', { accion: query.accion });
    }

    // Búsqueda de texto libre
    if (query.busqueda) {
      qb.andWhere(
        '(log.descripcion ILIKE :busq OR log.entidad_nombre ILIKE :busq OR log.usuario ILIKE :busq)',
        { busq: `%${query.busqueda}%` },
      );
    }

    // Filtro por rango de fechas
    if (query.fechaDesde) {
      qb.andWhere('log.fecha_creacion >= :desde', { desde: query.fechaDesde });
    }
    if (query.fechaHasta) {
      const hasta = new Date(query.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      qb.andWhere('log.fecha_creacion <= :hasta', { hasta: hasta.toISOString() });
    }

    // Ordenar por más reciente
    qb.orderBy('log.fecha_creacion', 'DESC');

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener todos los registros filtrados (para exportación).
   */
  async exportar(query: {
    modulo?: string;
    accion?: string;
    busqueda?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<AuditLog[]> {
    const qb = this.repo.createQueryBuilder('log');

    if (query.modulo) {
      qb.andWhere('log.modulo = :modulo', { modulo: query.modulo });
    }
    if (query.accion) {
      qb.andWhere('log.accion = :accion', { accion: query.accion });
    }
    if (query.busqueda) {
      qb.andWhere(
        '(log.descripcion ILIKE :busq OR log.entidad_nombre ILIKE :busq OR log.usuario ILIKE :busq)',
        { busq: `%${query.busqueda}%` },
      );
    }
    if (query.fechaDesde) {
      qb.andWhere('log.fecha_creacion >= :desde', { desde: query.fechaDesde });
    }
    if (query.fechaHasta) {
      const hasta = new Date(query.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      qb.andWhere('log.fecha_creacion <= :hasta', { hasta: hasta.toISOString() });
    }

    return qb.orderBy('log.fecha_creacion', 'DESC').getMany();
  }

  /**
   * Eliminar un registro.
   */
  async eliminar(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  /**
   * Limpiar toda la bitácora.
   */
  async limpiarTodo(): Promise<void> {
    await this.repo.clear();
  }
}
