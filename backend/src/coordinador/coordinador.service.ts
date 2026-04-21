import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CoordinadorService {
  constructor(private readonly dataSource: DataSource) {}

  async getDashboardStats() {
    const [
      estudiantesActivos,
      eventosEnCurso,
      certificadosMes,
      inscripcionesActivas,
      totalActividades,
    ] = await Promise.all([
      // Total estudiantes activos (usuarios con rol Estudiante y estado=1)
      this.dataSource.query(`
        SELECT COUNT(DISTINCT u.id)::int AS total
        FROM usuarios u
        INNER JOIN usuarios_roles ur ON ur.id_usuario = u.id
        INNER JOIN roles r ON r.id = ur.id_rol
        WHERE r.nombre_rol = 'Estudiante'
          AND u.estado = 1
      `),

      // Eventos en curso (estado=1)
      this.dataSource.query(`
        SELECT COUNT(*)::int AS total FROM eventos WHERE estado = 1
      `),

      // Certificados emitidos este mes
      this.dataSource.query(`
        SELECT COUNT(*)::int AS total
        FROM certificados
        WHERE DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', NOW())
      `),

      // Inscripciones activas
      this.dataSource.query(`
        SELECT COUNT(*)::int AS total FROM inscripciones WHERE estado = 1
      `),

      // Total actividades académicas
      this.dataSource.query(`
        SELECT COUNT(*)::int AS total FROM actividades_academicas
      `),
    ]);

    return {
      estudiantes_activos: estudiantesActivos[0]?.total ?? 0,
      eventos_en_curso: eventosEnCurso[0]?.total ?? 0,
      certificados_emitidos_mes: certificadosMes[0]?.total ?? 0,
      inscripciones_activas: inscripcionesActivas[0]?.total ?? 0,
      total_actividades: totalActividades[0]?.total ?? 0,
    };
  }
}
