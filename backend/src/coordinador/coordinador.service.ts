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

  // ══════════════════════════════════════════════════════════
  //  ESTADÍSTICAS ENRIQUECIDAS
  // ══════════════════════════════════════════════════════════

  /**
   * Inscritos por actividad académica.
   * Usado para generar gráficas de barras en el dashboard del coordinador.
   * Filtrables por evento.
   */
  async getEstadisticasInscritos(eventoId?: number) {
    const params: any[] = [];
    let filtroEvento = '';

    if (eventoId) {
      params.push(eventoId);
      filtroEvento = `AND a.id_evento = $1`;
    }

    return this.dataSource.query(
      `SELECT
         a.id            AS actividad_id,
         a.nombre        AS actividad_nombre,
         e.nombre        AS evento_nombre,
         COUNT(i.id)::int AS total_inscritos,
         COUNT(CASE WHEN i.estado = 1 THEN 1 END)::int AS inscritos_activos,
         COUNT(CASE WHEN i.estado = 0 THEN 1 END)::int AS pendientes
       FROM actividades_academicas a
       INNER JOIN eventos e ON e.id = a.id_evento
       LEFT JOIN inscripciones i ON i.id_actividad_academica = a.id
       WHERE 1=1 ${filtroEvento}
       GROUP BY a.id, a.nombre, e.nombre
       ORDER BY total_inscritos DESC`,
      params,
    );
  }

  /**
   * Lista ponentes (rol=Ponente) que NO tienen ninguna impartición registrada
   * en el evento indicado. Si no se indica evento, devuelve los que no tienen
   * ninguna impartición en general.
   */
  async getPonentesSinActividad(eventoId?: number) {
    const params: any[] = [];
    let filtroEvento = '';

    if (eventoId) {
      params.push(eventoId);
      filtroEvento = `AND imp.id_evento = $1`;
    }

    return this.dataSource.query(
      `SELECT
         u.id,
         u.email,
         p.nombres,
         p.primer_apellido,
         p.segundo_apellido
       FROM usuarios u
       INNER JOIN usuarios_roles ur ON ur.id_usuario = u.id
       INNER JOIN roles r ON r.id = ur.id_rol
       LEFT  JOIN personas p ON p.id_usuario = u.id
       WHERE r.nombre_rol = 'Ponente'
         AND u.estado = 1
         AND u.id NOT IN (
           SELECT imp.id_usuario
           FROM imparticiones imp
           WHERE 1=1 ${filtroEvento}
         )
       ORDER BY p.primer_apellido ASC`,
      params,
    );
  }

  /**
   * Devuelve el ponente asignado y la lista de estudiantes inscritos de
   * una actividad académica. Equivalente al endpoint de participantes del
   * sistema Flask (/cursos/coor/cursos/:id/participantes).
   */
  async getParticipantesActividad(actividadId: number) {
    const [ponentes, estudiantes] = await Promise.all([
      // Ponente(s) asignados a la actividad
      this.dataSource.query(
        `SELECT
           u.id,
           u.email,
           p.nombres,
           p.primer_apellido,
           p.segundo_apellido,
           af.institucion
         FROM imparticiones imp
         INNER JOIN usuarios u ON u.id = imp.id_usuario
         LEFT  JOIN personas p ON p.id_usuario = u.id
         LEFT  JOIN afiliaciones af ON af.id_usuario = u.id
         WHERE imp.id_actividad_academica = $1`,
        [actividadId],
      ),

      // Estudiantes inscritos en la actividad
      this.dataSource.query(
        `SELECT
           i.id            AS inscripcion_id,
           i.estado,
           i.nota_principal,
           u.id            AS usuario_id,
           u.email,
           p.nombres,
           p.primer_apellido,
           p.segundo_apellido,
           p.documento_identidad,
           p.pais_origen,
           af.institucion
         FROM inscripciones i
         INNER JOIN usuarios u ON u.id = i.id_usuario
         LEFT  JOIN personas p ON p.id_usuario = u.id
         LEFT  JOIN afiliaciones af ON af.id_usuario = u.id
         WHERE i.id_actividad_academica = $1
           AND i.estado = 1
         ORDER BY p.primer_apellido ASC`,
        [actividadId],
      ),
    ]);

    return {
      actividad_id: actividadId,
      ponentes,
      total_estudiantes: estudiantes.length,
      estudiantes,
    };
  }
}
