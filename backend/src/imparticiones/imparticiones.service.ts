import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Imparticion } from './entities/imparticion.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AsignarPonenteDto } from './dto/asignar-ponente.dto';
import { CreateImparticionDto } from './dto/create-imparticion.dto';
import { RoleId } from '../usuarios/constants/user-roles.constants';

@Injectable()
export class ImparticionesService {
  constructor(
    @InjectRepository(Imparticion)
    private readonly imparticionRepository: Repository<Imparticion>,
    private readonly usuariosService: UsuariosService,
  ) {}

  /**
   * Vincula un ponente a una actividad.
   * Si el email no existe, crea el usuario automáticamente.
   */
  async asignarPonente(dto: AsignarPonenteDto) {
    const { email, nombres, primer_apellido, id_actividad, id_evento } = dto;

    // 1. Buscar si el usuario ya existe
    let usuario = await this.usuariosService.findOptionalByEmail(email);

    if (!usuario) {
      // 2. Si no existe, crearlo como Ponente
      usuario = (await this.usuariosService.crearPonente({
        email,
        password: 'Tyan.2026!', // Password temporal por defecto
        nombres,
        primer_apellido,
        id_rol: RoleId.PONENTE,
      })) as any;
    } else {
      // 3. Si existe, asegurar que tenga el rol de Ponente
      await this.usuariosService.asignarRol(usuario.id, RoleId.PONENTE);
    }

    // 4. Crear la Impartición (vincular a la actividad)
    if (!usuario) {
      throw new NotFoundException('No se pudo encontrar ni crear el usuario para el ponente.');
    }

    // Verificamos si ya está vinculado para evitar duplicados
    const existe = await this.imparticionRepository.findOne({
      where: {
        usuario: { id: usuario.id },
        actividadAcademica: { id: id_actividad },
      },
    });

    if (existe) return existe;

    const nuevaImparticion = this.imparticionRepository.create({
      usuario: { id: usuario.id },
      actividadAcademica: { id: id_actividad },
      evento: { id: id_evento },
    });

    return this.imparticionRepository.save(nuevaImparticion);
  }

  // ── Coordinador ─────────────────────────────────────────────

  /** Asignar un ponente a una actividad y evento */
  async asignar(dto: CreateImparticionDto) {
    const imparticion = this.imparticionRepository.create({
      usuario: { id: dto.id_usuario },
      actividadAcademica: { id: dto.id_actividad_academica },
      evento: { id: dto.id_evento },
    });
    return this.imparticionRepository.save(imparticion);
  }

  /** Remover una asignación de ponente */
  async remover(id: number) {
    const imparticion = await this.imparticionRepository.findOneBy({ id });
    if (!imparticion) {
      throw new NotFoundException(`Impartición ${id} no encontrada`);
    }
    await this.imparticionRepository.delete(id);
    return { mensaje: `Impartición ${id} eliminada` };
  }

  /** Listar imparticiones de un evento específico (directorio) */
  async findByEvento(eventoId: number) {
    return this.imparticionRepository.find({
      where: { evento: { id: eventoId } },
      relations: ['usuario', 'usuario.persona', 'actividadAcademica'],
    });
  }

  /** Listar imparticiones de una actividad específica (detalle de actividad) */
  async findByActividad(actividadId: number) {
    return this.imparticionRepository.find({
      where: { actividadAcademica: { id: actividadId } },
      relations: ['usuario', 'usuario.persona', 'actividadAcademica', 'evento'],
    });
  }

  // ── Métodos legacy (scaffold default) ──────────────────────

  create(data: Partial<Imparticion>) {
    return this.imparticionRepository.save(this.imparticionRepository.create(data));
  }

  findAll() {
    return this.imparticionRepository.find({
      relations: ['usuario', 'actividadAcademica', 'evento'],
    });
  }

  findOne(id: number) {
    return this.imparticionRepository.findOne({
      where: { id },
      relations: ['usuario', 'actividadAcademica', 'evento'],
    });
  }

  update(id: number, data: Partial<Imparticion>) {
    return this.imparticionRepository.update(id, data);
  }

  remove(id: number) {
    return this.imparticionRepository.delete(id);
  }
}
