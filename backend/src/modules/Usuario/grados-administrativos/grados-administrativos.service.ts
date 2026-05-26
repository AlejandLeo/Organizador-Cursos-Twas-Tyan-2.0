import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradoAdministrativo } from './entities/grado-administrativo.entity';

@Injectable()
export class GradosAdministrativosService {
  constructor(
    @InjectRepository(GradoAdministrativo)
    private readonly repo: Repository<GradoAdministrativo>,
  ) {}

  async findAll(): Promise<GradoAdministrativo[]> {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: number): Promise<GradoAdministrativo> {
    const grado = await this.repo.findOne({ where: { id } });
    if (!grado) throw new NotFoundException(`Grado Administrativo con ID ${id} no encontrado`);
    return grado;
  }

  async create(data: Partial<GradoAdministrativo>): Promise<GradoAdministrativo> {
    const nuevo = this.repo.create(data);
    return this.repo.save(nuevo);
  }

  async update(id: number, data: Partial<GradoAdministrativo>): Promise<GradoAdministrativo> {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
