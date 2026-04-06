import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  create(data: Partial<Rol>) {
    const rol = this.rolRepository.create(data);
    return this.rolRepository.save(rol);
  }

  findAll() {
    return this.rolRepository.find();
  }

  findOne(id: number) {
    return this.rolRepository.findOneBy({ id_rol: id });
  }

  update(id: number, data: Partial<Rol>) {
    return this.rolRepository.update(id, data);
  }

  remove(id: number) {
    return this.rolRepository.delete(id);
  }
}
