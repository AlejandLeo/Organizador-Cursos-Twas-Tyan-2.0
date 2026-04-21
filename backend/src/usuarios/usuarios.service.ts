import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/usuario.entity';
import { Persona } from '../personas/entities/persona.entity';

import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { CrearPonenteDto } from './dto/crear-ponente.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';

// Entidades adicionales para registro y roles
import { Rol } from '../roles/entities/rol.entity';
import { UsuarioRol } from '../usuarios-roles/entities/usuario-rol.entity';
import { Afiliacion } from '../afiliaciones/entities/afiliacion.entity';
import { GradoAcademico } from '../grados-academicos/entities/grado-academico.entity';
import { RoleId } from './constants/user-roles.constants';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    private readonly dataSource: DataSource,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  CRUD BÁSICO
  // ══════════════════════════════════════════════════════════

  /**
   * Crea un usuario simple (solo credenciales).
   * La contraseña se hashea antes de guardarse. Nunca se guarda en texto plano.
   */
  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const existe = await this.usuarioRepository.findOneBy({
      email: createUsuarioDto.email,
    });
    if (existe) {
      throw new ConflictException(
        `El email '${createUsuarioDto.email}' ya está registrado.`,
      );
    }

    const hash = await bcrypt.hash(createUsuarioDto.password, 10);
    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      password: hash,
    });
    return this.usuarioRepository.save(usuario);
  }

  /**
   * Lista los usuarios ACTIVOS (estado = 1) con su perfil de persona y roles.
   * La contraseña nunca se incluye en la respuesta.
   *
   * @param soloActivos  Si es true (por defecto) filtra por estado = 1.
   *                     Pasar false para administración interna.
   */
  findAll(soloActivos = true): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: soloActivos ? { estado: 1 } : undefined,
      relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
      select: {
        id: true,
        email: true,
        estado: true,
        fecha_creacion: true,
        fecha_actualizacion: true,
        // password nunca se devuelve en listados
      },
    });
  }

  /**
   * Busca un usuario por ID. Incluye persona y sus roles con join.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id },
      relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }
    return usuario;
  }

  /**
   * Actualiza email y/o estado. Si se cambia el password aquí, también se hashea.
   */
  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.findOne(id);

    if (updateUsuarioDto.email && updateUsuarioDto.email !== usuario.email) {
      const existe = await this.usuarioRepository.findOneBy({
        email: updateUsuarioDto.email,
      });
      if (existe) {
        throw new ConflictException(
          `El email '${updateUsuarioDto.email}' ya está en uso.`,
        );
      }
    }

    if (updateUsuarioDto.password) {
      updateUsuarioDto.password = await bcrypt.hash(
        updateUsuarioDto.password,
        10,
      );
    }

    await this.usuarioRepository.update(id, updateUsuarioDto);
    return this.findOne(id);
  }

  /**
   * Elimina un usuario (y su persona por CASCADE definida en la entidad).
   */
  async remove(id: number): Promise<{ mensaje: string }> {
    await this.findOne(id); // valida existencia
    await this.usuarioRepository.delete(id);
    return { mensaje: `Usuario ${id} eliminado correctamente.` };
  }

  /**
   * Deshabilita un usuario (estado = 0) en lugar de eliminarlo físicamente.
   * Uso del coordinador para suspender accesos sin perder historias.
   */
  async deshabilitarUsuario(id: number): Promise<{ mensaje: string }> {
    await this.findOne(id);
    await this.usuarioRepository.update(id, { estado: 0 });
    return { mensaje: `Usuario ${id} deshabilitado correctamente.` };
  }

  // ══════════════════════════════════════════════════════════
  //  BÚSQUEDA Y FILTRADO (para el panel del Coordinador)
  // ══════════════════════════════════════════════════════════

  /**
   * Lista usuarios con filtros: por rol, búsqueda libre y paginación.
   * Nunca devuelve el campo password.
   */
  async findConFiltros(filtros: FiltrarUsuariosDto): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { rol, q, page = 1, limit = 20, soloActivos } = filtros;
    const soloActibosBool = soloActivos !== 'false';

    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'u.id',
        'u.email',
        'u.estado',
        'u.fecha_creacion',
        'p.nombres',
        'p.primer_apellido',
        'p.segundo_apellido',
        'p.documento_identidad',
        'p.celular',
        'p.pais_origen',
      ])
      .addSelect('r.nombre_rol', 'rol_nombre')
      .from('usuarios', 'u')
      .leftJoin('personas', 'p', 'p.id_usuario = u.id')
      .leftJoin('usuarios_roles', 'ur', 'ur.id_usuario = u.id')
      .leftJoin('roles', 'r', 'r.id = ur.id_rol');

    if (soloActibosBool) {
      qb.where('u.estado = :estado', { estado: 1 });
    }

    if (rol) {
      qb.andWhere('LOWER(r.nombre_rol) = LOWER(:rol)', { rol });
    }

    if (q) {
      qb.andWhere(
        '(LOWER(p.nombres) ILIKE :q OR LOWER(p.primer_apellido) ILIKE :q OR LOWER(u.email) ILIKE :q)',
        { q: `%${q.toLowerCase()}%` },
      );
    }

    const total = await qb.getCount();

    qb.skip((page - 1) * limit).take(limit);

    const data = await qb.getRawMany();

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  // ══════════════════════════════════════════════════════════
  //  CREACIÓN DIRECTA DE PONENTE (por el Coordinador)
  // ══════════════════════════════════════════════════════════

  /**
   * Crea un usuario tipo Ponente: credenciales + persona + rol Ponente.
   * Se ejecuta dentro de una transacción.
   */
  async crearPonente(dto: CrearPonenteDto): Promise<Omit<Usuario, 'password'>> {
    const existe = await this.usuarioRepository.findOneBy({ email: dto.email });
    if (existe) {
      throw new ConflictException(`El email '${dto.email}' ya está registrado.`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const hash = await bcrypt.hash(dto.password, 10);

      const usuario = queryRunner.manager.create(Usuario, {
        email: dto.email,
        password: hash,
        estado: 1,
      });
      const usuarioGuardado = await queryRunner.manager.save(usuario);

      const { email, password, ...datosPersona } = dto;
      const persona = queryRunner.manager.create(Persona, {
        ...datosPersona,
        usuario: usuarioGuardado,
      });
      await queryRunner.manager.save(persona);

      const ponenteRol = await queryRunner.manager.findOne(Rol, {
        where: { id: RoleId.PONENTE },
      });

      if (ponenteRol) {
        const usuarioRol = queryRunner.manager.create(UsuarioRol, {
          usuario: usuarioGuardado,
          rol: ponenteRol,
          estado: 1,
        });
        await queryRunner.manager.save(usuarioRol);
      }

      await queryRunner.commitTransaction();
      return this.getPerfil(usuarioGuardado.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ══════════════════════════════════════════════════════════
  //  AUTH
  // ══════════════════════════════════════════════════════════

  /**
   * Login: verifica credenciales y devuelve el usuario sin password.
   *
   * NOTA para producción: aquí deberías generar y devolver un JWT.
   * Por ahora devolvemos el usuario como confirmación de login exitoso.
   */
  async login(loginDto: LoginDto): Promise<Omit<Usuario, 'password'>> {
    // Buscamos por email — no usamos findBy directo para poder cargar relaciones
    const usuario = await this.usuarioRepository.findOne({
      where: { email: loginDto.email },
      relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
    });

    if (!usuario) {
      // Usamos mensaje genérico para no revelar si el email existe
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    if (usuario.estado === 0) {
      throw new UnauthorizedException(
        'Tu cuenta está inactiva. Contacta al administrador.',
      );
    }

    const passwordValido = await bcrypt.compare(
      loginDto.password,
      usuario.password,
    );
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // Eliminamos password del objeto antes de devolver
    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword as Omit<Usuario, 'password'>;
  }

  /**
   * Cambia la contraseña de un usuario verificando la contraseña actual.
   */
  async changePassword(
    id: number,
    dto: ChangePasswordDto,
  ): Promise<{ mensaje: string }> {
    // Para comparar el hash necesitamos traer la contraseña
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id },
      select: ['id', 'password'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    const actual_valida = await bcrypt.compare(
      dto.password_actual,
      usuario.password,
    );
    if (!actual_valida) {
      throw new BadRequestException('La contraseña actual es incorrecta.');
    }

    const nuevaHash = await bcrypt.hash(dto.password_nuevo, 10);
    await this.usuarioRepository.update(id, { password: nuevaHash });

    return { mensaje: 'Contraseña actualizada correctamente.' };
  }

  // ══════════════════════════════════════════════════════════
  //  REGISTRO COMPLETO (Usuario + Persona + Rol + Afiliación)
  // ══════════════════════════════════════════════════════════

  /**
   * Registro unificado: crea un usuario, su perfil de persona,
   * le asigna el rol de Estudiante (ID 4) y opcionalmente su primera afiliación.
   */
  async register(dto: RegisterDto): Promise<Omit<Usuario, 'password'>> {
    const existe = await this.usuarioRepository.findOneBy({ email: dto.email });
    if (existe) {
      throw new ConflictException(
        `El email '${dto.email}' ya está registrado.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1️⃣ Hashear contraseña
      const hash = await bcrypt.hash(dto.password, 10);

      // 2️⃣ Crear usuario
      const usuario = queryRunner.manager.create(Usuario, {
        email: dto.email,
        password: hash,
        estado: 1,
      });
      const usuarioGuardado = await queryRunner.manager.save(usuario);

      // 3️⃣ Crear persona vinculada
      const {
        email,
        password,
        institucion,
        tipo_afiliacion,
        area_tematica,
        disciplina_cientifica,
        id_grado_academico,
        ...datoPersona
      } = dto;

      const persona = queryRunner.manager.create(Persona, {
        ...datoPersona,
        usuario: usuarioGuardado,
      });
      await queryRunner.manager.save(persona);

      // 4️⃣ Asignar Rol de Estudiante por defecto
      const estudianteRol = await queryRunner.manager.findOne(Rol, {
        where: { id: RoleId.ESTUDIANTE },
      });

      if (estudianteRol) {
        const usuarioRol = queryRunner.manager.create(UsuarioRol, {
          usuario: usuarioGuardado,
          rol: estudianteRol,
          estado: 1,
        });
        await queryRunner.manager.save(usuarioRol);
      }

      // 5️⃣ Crear Afiliación Inicial (si se proveen datos)
      if (institucion) {
        const afiliacion = queryRunner.manager.create(Afiliacion, {
          institucion,
          tipo_afiliacion,
          area_tematica,
          disciplina_cientifica,
          id_grado_academico,
          usuario: usuarioGuardado,
          estado: 1,
        });
        await queryRunner.manager.save(afiliacion);
      }

      await queryRunner.commitTransaction();

      // Devolvemos el perfil cargado (usando el método existente)
      return this.getPerfil(usuarioGuardado.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Asigna un nuevo rol a un usuario existente verificando que no lo tenga ya.
   */
  async asignarRol(
    usuarioId: number,
    rolId: number,
  ): Promise<Omit<Usuario, 'password'>> {
    const usuario = await this.findOne(usuarioId);
    const rol = await this.dataSource
      .getRepository(Rol)
      .findOneBy({ id: rolId });

    if (!rol) {
      throw new NotFoundException(`Rol con id ${rolId} no encontrado.`);
    }

    // Verificar si ya tiene el rol
    const existeRelacion = await this.dataSource
      .getRepository(UsuarioRol)
      .findOne({
        where: {
          usuario: { id: usuarioId },
          rol: { id: rolId },
        },
      });

    if (!existeRelacion) {
      const nuevaRelacion = this.dataSource.getRepository(UsuarioRol).create({
        usuario: usuario,
        rol: rol,
        estado: 1,
      });
      await this.dataSource.getRepository(UsuarioRol).save(nuevaRelacion);
    }

    return this.getPerfil(usuarioId);
  }

  // ══════════════════════════════════════════════════════════
  //  PERFIL COMPLETO (join con múltiples tablas)
  // ══════════════════════════════════════════════════════════

  /**
   * Devuelve el perfil completo de un usuario:
   * datos de usuario + persona + roles asignados.
   *
   * Este es un ejemplo de endpoint que consulta múltiples tablas
   * usando TypeORM relations.
   */
  async getPerfil(id: number): Promise<Omit<Usuario, 'password'>> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id },
      relations: [
        'persona',
        'usuariosRoles',
        'usuariosRoles.rol',
        'afiliaciones',
        'afiliaciones.gradoAcademico',
      ],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    const { password, ...perfil } = usuario;
    return perfil as Omit<Usuario, 'password'>;
  }
}
