import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from './entities/persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private readonly personasRepository: Repository<Persona>,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  CRUD COMPLETO
  // ══════════════════════════════════════════════════════════

  /**
   * Crea un perfil de persona.
   * Normalmente se crea en conjunto con un usuario (ver UsuariosService.register),
   * pero también puede crearse de forma independiente.
   */
  create(dto: CreatePersonaDto): Promise<Persona> {
    const persona = this.personasRepository.create(dto);
    return this.personasRepository.save(persona);
  }

  /**
   * Lista todas las personas. Incluye los datos del usuario vinculado (JOIN).
   * El select omite el password del usuario por seguridad.
   */
  findAll(): Promise<Persona[]> {
    return this.personasRepository.find({
      relations: ['usuario'],
    });
  }

  /**
   * Busca una persona por su ID de perfil (id_perfil).
   */
  async findOne(id: number): Promise<Persona> {
    const persona = await this.personasRepository.findOne({
      where: { id: id },
      relations: [
        'usuario',
        'usuario.usuariosRoles',
        'usuario.usuariosRoles.rol',
      ],
    });
    if (!persona) {
      throw new NotFoundException(`Persona con id ${id} no encontrada.`);
    }
    return persona;
  }

  /**
   * Busca la persona vinculada a un usuario específico.
   * Ejemplo de búsqueda con condición sobre la relación (nested where).
   */
  async findByUsuario(idUsuario: number): Promise<Persona> {
    const persona = await this.personasRepository.findOne({
      where: { usuario: { id: idUsuario } },
      relations: ['usuario'],
    });
    if (!persona) {
      throw new NotFoundException(
        `No se encontró perfil para el usuario ${idUsuario}.`,
      );
    }
    return persona;
  }

  /**
   * Actualiza los datos personales de un perfil.
   */
  async update(id: number, dto: UpdatePersonaDto): Promise<Persona> {
    await this.findOne(id); // valida existencia
    await this.personasRepository.update(id, dto);
    return this.findOne(id);
  }

  /**
   * Elimina un perfil. Útil si el usuario se da de baja pero aún no se elimina.
   */
  async remove(id: number): Promise<{ mensaje: string }> {
    await this.findOne(id);
    await this.personasRepository.delete(id);
    return { mensaje: `Persona con id ${id} eliminada correctamente.` };
  }
}
