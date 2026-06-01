import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { ActividadAcademica } from './entities/actividad-academica.entity';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { MailService } from '../../Comun/mail/mail.service';
import { formatMediaUrl } from '../../../common/media-url.util';

@Injectable()
export class ActividadesAcademicasService {
  constructor(
    @InjectRepository(ActividadAcademica)
    private readonly actividadRepository: Repository<ActividadAcademica>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  async verificarPropiedad(eventoId: number, usuario: any) {
    if (!usuario) return;
    if (usuario.roles?.includes('Super Usuario')) return;

    const coord = await this.dataSource.query(
      `SELECT 1 FROM coordinacion_eventos WHERE id_evento = $1 AND id_usuario = $2`,
      [eventoId, usuario.id]
    );

    if (coord.length === 0) {
      throw new ForbiddenException('No tienes permisos sobre el evento de esta actividad académica.');
    }
  }

  private formatImageUrl(filenameOrUrl: string, folder: string = 'cursos'): string | null {
    return formatMediaUrl(filenameOrUrl, folder);
  }

  // ── CRUD básico ────────────────────────────────────────────

  async findAll() {
    const acts = await this.actividadRepository.find({ relations: ['evento', 'inscripciones', 'modalidades'] });
    return acts.map(act => {
      const firstMod = act.modalidades?.[0];
      return {
        ...act,
        min_nota: firstMod ? firstMod.min_nota : 71,
        min_asistencia: firstMod ? firstMod.min_asistencia : 80,
        modalidad: firstMod ? firstMod.tipo : 'Presencial',
        imagen: this.formatImageUrl(act.imagen)
      };
    });
  }

  async findOne(id: number) {
    const act = await this.actividadRepository.findOne({
      where: { id },
      relations: ['evento', 'modalidades', 'modalidades.sesiones', 'imparticiones', 'imparticiones.usuario', 'imparticiones.usuario.persona'],
    });
    if (!act) throw new NotFoundException(`Actividad ${id} no encontrada.`);
    const firstMod = act.modalidades?.[0];
    return {
      ...act,
      min_nota: firstMod ? firstMod.min_nota : 71,
      min_asistencia: firstMod ? firstMod.min_asistencia : 80,
      modalidad: firstMod ? firstMod.tipo : 'Presencial',
      imagen: this.formatImageUrl(act.imagen)
    };
  }

  // ── Coordinador ─────────────────────────────────────────────

  /** Lista todas las actividades de un evento (para el panel del coordinador) */
  async findByEvento(eventoId: number, usuario?: any) {
    const query = this.actividadRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.modalidades', 'm')
      .innerJoin('a.evento', 'e')
      .where('e.id = :eventoId', { eventoId })
      .orderBy('a.fecha_inicio', 'ASC');

    if (usuario && !usuario.roles?.includes('Super Usuario')) {
      query.innerJoin('e.coordinaciones', 'c')
           .andWhere('c.usuario.id = :usuarioId', { usuarioId: usuario.id });
    }

    const results = await query.getMany();
    return results.map(act => {
      const firstMod = act.modalidades?.[0];
      return {
        ...act,
        estado: Number(act.estado),
        min_nota: firstMod ? firstMod.min_nota : 71,
        min_asistencia: firstMod ? firstMod.min_asistencia : 80,
        modalidad: firstMod ? firstMod.tipo : 'Presencial',
        imagen: this.formatImageUrl(act.imagen)
      };
    });
  }

  /** Crea una actividad asignándola al evento indicado en el DTO */
  async crear(dto: CreateActividadDto, usuario?: any, file?: Express.Multer.File) {
    if (usuario) {
      await this.verificarPropiedad(dto.id_evento, usuario);
    }
    const { id_evento, modalidad, min_nota, min_asistencia, ...campos } = dto;
    const data: any = {
      ...campos,
      evento: { id: id_evento },
    };
    if (file) data.imagen = file.filename;

    const actividad = this.actividadRepository.create(data as any) as unknown as ActividadAcademica;
    const saved = await this.actividadRepository.save(actividad);

    // Guardar modalidad por defecto
    await this.dataSource.query(
      `INSERT INTO curso_modalidades (id_actividad_academica, tipo, min_nota, min_asistencia) VALUES ($1, $2, $3, $4)`,
      [saved.id, modalidad || 'Presencial', min_nota || 0, min_asistencia || 0]
    );

    return this.findOne(saved.id);
  }

  async actualizar(id: number, dto: UpdateActividadDto, usuario?: any, file?: Express.Multer.File) {
    // 1. Obtener la entidad raw (sin URLs formateadas)
    const actRaw = await this.actividadRepository.findOne({
      where: { id },
      relations: ['evento', 'modalidades']
    });
    if (!actRaw) throw new NotFoundException(`Actividad ${id} no encontrada.`);

    if (usuario) {
      await this.verificarPropiedad(actRaw.evento.id, usuario);
      if (dto.id_evento && dto.id_evento !== actRaw.evento.id) {
        await this.verificarPropiedad(dto.id_evento, usuario);
      }
    }

    const { id_evento, modalidad, min_nota, min_asistencia, sesiones, imagen, ...campos } = dto;
    
    // 2. Manejo de imagen y limpieza de la anterior
    if (file) {
      if (actRaw.imagen && !actRaw.imagen.startsWith('http')) {
        const oldPath = `./uploads/cursos/${actRaw.imagen}`;
        if (existsSync(oldPath)) unlinkSync(oldPath);
      }
      actRaw.imagen = file.filename;
    }

    // 3. Actualizar campos básicos
    const camposAny = campos as any;
    if (camposAny.fecha_inicio === '') camposAny.fecha_inicio = null;
    if (camposAny.fecha_fin === '') camposAny.fecha_fin = null;
    
    if (camposAny.estado !== undefined) {
        await this.actividadRepository.update(id, { estado: Number(camposAny.estado) });
        actRaw.estado = Number(camposAny.estado);
    }
    
    Object.assign(actRaw, camposAny);
    // FORZAR tipo correcto después de Object.assign (que pudo poner un string)
    if (camposAny.estado !== undefined) {
        actRaw.estado = Number(camposAny.estado);
    }
    if (id_evento) actRaw.evento = { id: id_evento } as any;

    console.log(`[ACTIVIDAD ${id}] Guardando con estado = ${actRaw.estado} (tipo: ${typeof actRaw.estado})`);
    await this.actividadRepository.save(actRaw);

    // Actualizar Modalidad (primera encontrada)
    if (modalidad !== undefined || min_nota !== undefined || min_asistencia !== undefined || sesiones !== undefined) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        let mod = actRaw.modalidades?.[0];
        if (!mod) {
          const res = await queryRunner.manager.query(
            `INSERT INTO curso_modalidades (id_actividad_academica, tipo, min_nota, min_asistencia) VALUES ($1, $2, $3, $4) RETURNING id`,
            [id, modalidad || 'Presencial', min_nota || 0, min_asistencia || 0]
          );
          mod = { id: res[0].id } as any;
        } else {
          const updateFields: string[] = [];
          const values: any[] = [];
          if (modalidad !== undefined) { updateFields.push(`tipo = $${values.length + 1}`); values.push(modalidad); }
          if (min_nota !== undefined) { updateFields.push(`min_nota = $${values.length + 1}`); values.push(min_nota); }
          if (min_asistencia !== undefined) { updateFields.push(`min_asistencia = $${values.length + 1}`); values.push(min_asistencia); }
          
          if (updateFields.length > 0) {
            values.push(mod.id);
            await queryRunner.manager.query(
              `UPDATE curso_modalidades SET ${updateFields.join(', ')} WHERE id = $${values.length}`,
              values
            );
          }
        }

        // Actualizar Sesiones
        if (sesiones !== undefined && Array.isArray(sesiones)) {
          await queryRunner.manager.query(`DELETE FROM sesiones_academicas WHERE id_curso_modalidad = $1`, [mod.id]);
          for (const s of sesiones) {
            await queryRunner.manager.query(
              `INSERT INTO sesiones_academicas (id_curso_modalidad, dia, hora_inicio, hora_fin) VALUES ($1, $2, $3, $4)`,
              [mod.id, s.dia, s.hora_inicio, s.hora_fin]
            );
          }
        }
        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    return this.findOne(id);
  }

  async eliminar(id: number, usuario?: any) {
    const act = await this.actividadRepository.findOne({
      where: { id },
      relations: ['evento', 'inscripciones', 'imparticiones', 'modalidades', 'certificados']
    });
    
    if (!act) throw new NotFoundException(`Actividad ${id} no encontrada.`);

    if (usuario) {
      await this.verificarPropiedad(act.evento.id, usuario);
    }

    // 1. Validar dependencias
    const dependencias: string[] = [];
    if (act.inscripciones?.length > 0) dependencias.push(`${act.inscripciones.length} inscripciones de estudiantes`);
    if (act.imparticiones?.length > 0) dependencias.push(`${act.imparticiones.length} ponentes asignados`);
    if (act.certificados?.length > 0) dependencias.push(`${act.certificados.length} certificados emitidos`);

    if (dependencias.length > 0) {
      throw new ForbiddenException(
        `No se puede eliminar la actividad porque tiene registros asociados: ${dependencias.join(', ')}. ` +
        `Debe anular o desvincular estos registros antes de borrar la actividad.`
      );
    }

    try {
      // 2. Limpiar modalidades antes de borrar la actividad
      if (act.modalidades?.length > 0) {
        const modIds = act.modalidades.map(m => m.id);
        // Las sesiones se borran por cascada o manualmente si es necesario
        await this.dataSource.query(`DELETE FROM sesiones_academicas WHERE id_curso_modalidad IN (${modIds.join(',')})`);
        await this.dataSource.query(`DELETE FROM curso_modalidades WHERE id_actividad_academica = $1`, [id]);
      }

      await this.actividadRepository.delete(id);
      return { mensaje: `Actividad ${id} eliminada correctamente.` };
    } catch (error) {
      console.error('Error eliminando actividad:', error);
      throw new ForbiddenException('Error de base de datos al intentar eliminar la actividad. Verifique restricciones de integridad.');
    }
  }

  async solicitarActivacion(id: number, usuario: any) {
    const act = await this.actividadRepository.findOne({ where: { id }, relations: ['evento'] });
    if (!act) throw new NotFoundException(`Actividad ${id} no encontrada.`);

    // Marcar en la descripción que hay una solicitud pendiente
    const tag = `[SOLICITUD_ACTIVACION]`;
    if (!act.descripcion?.includes(tag)) {
        act.descripcion = `${tag}\n${act.descripcion || ''}`;
        await this.actividadRepository.save(act);
    }

    // El log para activación ya fue añadido a la descripción. No se envía correo a MAIL_USER.
    
    return { message: 'Solicitud enviada correctamente al Super Usuario.' };
  }

  async getSolicitudesPendientes() {
    const solicitudes = await this.actividadRepository.createQueryBuilder('a')
        .leftJoinAndSelect('a.evento', 'e')
        .where('a.estado = :estado', { estado: -1 })
        .andWhere('a.descripcion LIKE :tag', { tag: '%[SOLICITUD_ACTIVACION]%' })
        .getMany();
    
    return solicitudes.map(act => ({
        ...act,
        imagen: this.formatImageUrl(act.imagen)
    }));
  }

  async aprobarReactivacion(id: number) {
    const act = await this.actividadRepository.findOneBy({ id });
    if (!act) throw new NotFoundException(`Actividad ${id} no encontrada.`);

    act.estado = 1;
    // Limpiar el tag de solicitud
    act.descripcion = (act.descripcion || '').replace('[SOLICITUD_ACTIVACION]\n', '').replace('[SOLICITUD_ACTIVACION]', '');
    
    return await this.actividadRepository.save(act);
  }

  async verificarPermisosEdicion(actividadId: number, usuario: any) {
    if (!usuario) return;
    if (usuario.roles?.includes('Super Usuario')) return;

    // Obtener la actividad
    const act = await this.actividadRepository.findOne({
      where: { id: actividadId },
      relations: ['evento'],
    });
    if (!act) throw new NotFoundException(`Actividad ${actividadId} no encontrada.`);

    // Verificar si es coordinador del evento
    const coord = await this.dataSource.query(
      `SELECT 1 FROM coordinacion_eventos WHERE id_evento = $1 AND id_usuario = $2`,
      [act.evento.id, usuario.id]
    );

    if (coord.length > 0) return; // Es coordinador

    // Verificar si es ponente asignado
    const isImpartidor = await this.dataSource.query(
      `SELECT 1 FROM imparticiones WHERE id_actividad_academica = $1 AND id_usuario = $2`,
      [actividadId, usuario.id]
    );

    if (isImpartidor.length > 0) return; // Es ponente asignado

    throw new ForbiddenException('No tienes permisos sobre esta actividad académica.');
  }

  async actualizarMateriales(actividadId: number, materiales: any[], usuario: any) {
    await this.verificarPermisosEdicion(actividadId, usuario);

    const act = await this.actividadRepository.findOneBy({ id: actividadId });
    if (!act) throw new NotFoundException(`Actividad ${actividadId} no encontrada.`);

    act.materiales = materiales;
    await this.actividadRepository.save(act);

    return { 
      message: 'Materiales actualizados correctamente.', 
      materiales: act.materiales 
    };
  }

  // Métodos legacy
  create(data: Partial<ActividadAcademica>) {
    const actividad = this.actividadRepository.create(data);
    return this.actividadRepository.save(actividad);
  }

  update(id: number, data: Partial<ActividadAcademica>) {
    return this.actividadRepository.update(id, data);
  }

  remove(id: number) {
    return this.eliminar(id);
  }
}
