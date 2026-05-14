import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, In } from 'typeorm';
import { Evento } from './entities/evento.entity';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Valida si el usuario logueado tiene permisos sobre el evento.
   * Si es Super Usuario pasa de largo, si no, se busca su asignación en coordinaciones.
   */
  async verificarPropiedad(eventoId: number, usuario: any) {
    if (!usuario) return;
    if (usuario.roles?.includes('Super Usuario')) return;

    const coord = await this.dataSource.query(
      `SELECT 1 FROM coordinacion_eventos WHERE id_evento = $1 AND id_usuario = $2`,
      [eventoId, usuario.id]
    );

    if (coord.length === 0) {
      throw new ForbiddenException('No tienes permisos sobre este evento. Debes ser Super Usuario o el Coordinador asignado.');
    }
  }

  create(data: Partial<Evento>) {
    const evento = this.eventoRepository.create(data);
    return this.eventoRepository.save(evento);
  }

  private formatImageUrl(filenameOrUrl: string, folder: string = 'imagenes'): string | null {
    if (!filenameOrUrl) return null;
    if (filenameOrUrl.startsWith('http')) return filenameOrUrl;

    // Evitar doble codificación: decodificar primero por si ya viene codificado
    const cleanFilename = decodeURIComponent(filenameOrUrl);

    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    return `${baseUrl}/uploads/${folder}/${encodeURIComponent(cleanFilename)}`;
  }

  async findAll() {
    const query = this.eventoRepository.createQueryBuilder('evento')
      .leftJoinAndSelect('evento.actividades', 'actividad')
      .leftJoinAndSelect('actividad.modalidades', 'modalidad')
      .leftJoinAndSelect('actividad.inscripciones', 'inscripcion')
      .orderBy('evento.prioridad', 'ASC')
      .addOrderBy('evento.fecha_creacion', 'DESC');

    const eventos = await query.getMany();
    return eventos.map(evento => ({
      ...evento,
      logo: this.formatImageUrl(evento.logo, 'logo'),
      imagen_fondo: this.formatImageUrl(evento.imagen_fondo, 'fondos'),
      actividades: (evento.actividades || [])
        .map(act => ({
          ...act,
          estado: Number(act.estado),
          imagen: this.formatImageUrl(act.imagen, 'cursos')
        }))
    }));
  }

  async findOne(id: number) {
    const evento = await this.eventoRepository.findOneBy({ id: id });
    if (evento) {
      return {
        ...evento,
        logo: this.formatImageUrl(evento.logo, 'logo'),
        imagen_fondo: this.formatImageUrl(evento.imagen_fondo, 'fondos')
      };
    }
    return evento;
  }

  async getSesiones(id: number) {
    const evento = await this.eventoRepository.findOne({
      where: { id },
      relations: [
        'actividades',
        'actividades.modalidades',
        'actividades.modalidades.sesiones'
      ]
    });
    return evento ? evento.actividades : [];
  }

  async getImparticiones(id: number) {
    const evento = await this.eventoRepository.findOne({
      where: { id },
      relations: [
        'imparticiones',
        'imparticiones.usuario',
        'imparticiones.usuario.persona',
        'imparticiones.usuario.afiliaciones',
        'imparticiones.usuario.afiliaciones.gradoAcademico',
      ],
    });

    if (!evento || !evento.imparticiones) return [];

    // Agrupar por usuario para evitar duplicados si un ponente tiene varias actividades
    const expositoresMap = new Map();

    evento.imparticiones.forEach((imp) => {
      if (imp.usuario && !expositoresMap.has(imp.usuario.id)) {
        const u = imp.usuario;
        const persona = u.persona || {};
        const ga = u.afiliaciones?.[0]?.gradoAcademico || {};

        expositoresMap.set(u.id, {
          id: u.id,
          email: u.email,
          nombres: persona.nombres,
          primer_apellido: persona.primer_apellido,
          segundo_apellido: persona.segundo_apellido,
          profesion: u.afiliaciones?.[0]?.institucion || 'Expositor',
          grado_abreviacion: ga.abreviacion || '',
          foto: this.formatImageUrl(persona.firma_dig, 'perfiles'), // Usamos perfiles para fotos
        });
      }
    });

    return Array.from(expositoresMap.values());
  }

  async getCoordinaciones(id: number) {
    const evento = await this.eventoRepository.findOne({
      where: { id },
      relations: [
        'coordinaciones',
        'coordinaciones.usuario',
        'coordinaciones.usuario.persona'
      ]
    });
    return evento ? evento.coordinaciones : [];
  }

  async getActividades(id: number) {
    const evento = await this.eventoRepository.findOne({
      where: { id },
      relations: [
        'actividades',
        'actividades.modalidades',
        'actividades.imparticiones',
        'actividades.imparticiones.usuario',
        'actividades.imparticiones.usuario.persona',
      ]
    });
    return evento ? evento.actividades : [];
  }

  // ══════════════════════════════════════════════════════════
  //  COORDINADOR — CRUD Admin
  // ══════════════════════════════════════════════════════════

  /**
   * Lista paginada de eventos con filtro por estado.
   * Para usar en el panel del Coordinador.
   */
  async findAllAdmin(estado?: number, page = 1, limit = 20, usuario?: any) {
    const rolesUser = Array.isArray(usuario?.roles) ? usuario.roles.map(r => String(r).toLowerCase().trim()) : [];
    const esSuper = rolesUser.includes('super usuario') || rolesUser.includes('admin') || rolesUser.includes('superusuario');

<<<<<<< HEAD
    console.log(`--- DEBUG EVENTOS ---`);
    console.log(`Usuario: ${usuario?.email} (ID: ${usuario?.id})`);
    console.log(`Roles Detectados: [${rolesUser.join(', ')}]`);
    console.log(`¿Es Super Usuario?: ${esSuper}`);
    console.log(`----------------------`);

    const query = this.eventoRepository.createQueryBuilder('evento')
      .leftJoinAndSelect('evento.actividades', 'actividad')
      .leftJoinAndSelect('actividad.modalidades', 'modalidad')
      .leftJoinAndSelect('actividad.inscripciones', 'inscripcion');

    // 1. Aislamiento por Coordinación (SOLO si no es Super Usuario)
    if (usuario && !esSuper) {
      query.innerJoin('evento.coordinaciones', 'coordinacion', 'coordinacion.id_usuario = :userId', { userId: usuario.id });
=======
    // Aislamiento de datos: Si no es Super Usuario, solo ver sus coordinaciones
    if (usuario && !usuario.roles?.includes('Super Usuario')) {
      where.coordinaciones = { usuario: { id: usuario.id } };
      // El coordinador NO ve los archivados (fase 5) por defecto en su dashboard principal
      where.fase = LessThan(5);
>>>>>>> dd5dcbbcab549efef3d4630361299364dfd06cf3
    }

    // 2. Filtrado por estado
    if (estado !== undefined) {
      query.andWhere('evento.estado = :estado', { estado });
    }

    // 3. Orden y Paginación
    query.orderBy('evento.prioridad', 'ASC')
      .addOrderBy('evento.fecha_creacion', 'DESC');

    // Para evitar problemas de "take" con relaciones OneToMany, usamos findAndCount tradicional 
    // si es posible, o QueryBuilder sin take si el set es pequeño.
    const eventos = await query.getMany();
    const total = eventos.length;

    console.log(`[EventosService] findAllAdmin - Total encontrados en DB: ${total}`);

    // Paginación manual simple
    const start = (page - 1) * limit;
    const paginated = eventos.slice(start, start + limit);

    const data = paginated.map((evento) => {
      // Forzamos la limpieza de URLS
      return {
        ...evento,
        logo: this.formatImageUrl(evento.logo, 'logo'),
        imagen_fondo: this.formatImageUrl(evento.imagen_fondo, 'fondos'),
        actividades: (evento.actividades || []).map(act => ({
          ...act,
          estado: Number(act.estado),
          imagen: this.formatImageUrl(act.imagen, 'cursos')
        }))
      };
    });

    return { data, total, page, limit };
  }

  /**
   * Crea un evento con imagen opcional (multipart/form-data).
   * El nombre del archivo guardado por multer se almacena en `logo` o `imagen_fondo`.
   */
  async crearConImagen(
    dto: CreateEventoDto,
    imagenPortada?: Express.Multer.File,
    imagenFondo?: Express.Multer.File,
    usuario?: any,
  ) {
    const data: Partial<Evento> = { ...dto } as any;
    if (dto.prioridad) data.prioridad = parseInt(dto.prioridad, 10);
    if (imagenPortada) data.logo = imagenPortada.filename;
    if (imagenFondo) data.imagen_fondo = imagenFondo.filename;

    const evento = this.eventoRepository.create(data);
    const guardado = await this.eventoRepository.save(evento);

    // Asignación automática de coordinación si el creador es un usuario identificado
    if (usuario && usuario.id) {
      const coordinacionRepo = this.eventoRepository.manager.getRepository('CoordinacionEvento');
      await coordinacionRepo.save({
        usuario: { id: usuario.id },
        evento: { id: guardado.id },
        estado: 1
      });
    }

    return {
      ...guardado,
      logo: this.formatImageUrl(guardado.logo, 'logo'),
      imagen_fondo: this.formatImageUrl(guardado.imagen_fondo, 'fondos'),
    };
  }

  /**
   * Actualiza un evento con imagen opcional.
   * Si se sube una nueva imagen, elimina el archivo anterior del disco.
   */
  async actualizarConImagen(
    id: number,
    dto: UpdateEventoDto,
    imagenPortada?: Express.Multer.File,
    imagenFondo?: Express.Multer.File,
    usuario?: any,
  ) {
    if (usuario) {
      await this.verificarPropiedad(id, usuario);
    }

    const evento = await this.eventoRepository.findOneBy({ id });
    if (!evento) throw new NotFoundException(`Evento ${id} no encontrado.`);

    const data: Partial<Evento> = { ...dto } as any;
    if (dto.prioridad) data.prioridad = parseInt(dto.prioridad as any, 10);

    if (imagenPortada) {
      if (evento.logo && !evento.logo.startsWith('http')) {
        const oldPath = `uploads/eventos/${evento.logo}`;
        if (existsSync(oldPath)) unlinkSync(oldPath);
      }
      data.logo = imagenPortada.filename;
    }

    if (imagenFondo) {
      if (evento.imagen_fondo && !evento.imagen_fondo.startsWith('http')) {
        const oldPath = `uploads/fondos/${evento.imagen_fondo}`;
        if (existsSync(oldPath)) unlinkSync(oldPath);
      }
      data.imagen_fondo = imagenFondo.filename;
    }

    await this.eventoRepository.update(id, data);
    const actualizado = await this.eventoRepository.findOneBy({ id });
    return {
      ...actualizado,
      logo: this.formatImageUrl(actualizado!.logo, 'logo'),
      imagen_fondo: this.formatImageUrl(actualizado!.imagen_fondo, 'fondos'),
    };
  }

  async removeAdmin(id: number, usuario?: any) {
    if (usuario) {
      await this.verificarPropiedad(id, usuario);
    }
    const evento = await this.eventoRepository.findOne({
      where: { id },
      relations: ['actividades', 'coordinaciones', 'infosCertificados', 'imparticiones']
    });

    if (!evento) throw new NotFoundException(`Evento ${id} no encontrado.`);

    // 1. Validar dependencias para dar mensaje claro
    const dependencias: string[] = [];
    const ev = evento as any;
    if (Array.isArray(ev.actividades) && ev.actividades.length > 0) {
      dependencias.push(`${ev.actividades.length} actividades (cursos/talleres)`);
    }
    if (Array.isArray(ev.coordinaciones) && ev.coordinaciones.length > 0) {
      dependencias.push(`${ev.coordinaciones.length} responsables asignados`);
    }
    if (Array.isArray(ev.infosCertificados) && ev.infosCertificados.length > 0) {
      dependencias.push(`${ev.infosCertificados.length} plantillas de certificados`);
    }
    if (Array.isArray(ev.imparticiones) && ev.imparticiones.length > 0) {
      dependencias.push(`${ev.imparticiones.length} ponentes vinculados`);
    }

    if (dependencias.length > 0) {
      throw new ForbiddenException(
        `No se puede eliminar el evento porque tiene registros asociados: ${dependencias.join(', ')}. ` +
        `Debe eliminar o desvincular estos elementos antes de borrar el evento permanentemente.`
      );
    }

    try {
      await this.eventoRepository.delete(id);
      return { mensaje: `Evento ${id} eliminado correctamente.` };
    } catch (error) {
      console.error('Error eliminando evento:', error);
      throw new ForbiddenException('Error de base de datos al intentar eliminar el evento. Verifique restricciones de integridad.');
    }
  }

  update(id: number, data: Partial<Evento>) {
    return this.eventoRepository.update(id, data);
  }

  remove(id: number) {
    return this.eventoRepository.delete(id);
  }
}
