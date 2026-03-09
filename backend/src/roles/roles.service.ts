import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  create(createRolDto: CreateRolDto) {
    return this.rolRepository.save(createRolDto);
  }

  findAll() {
    return this.rolRepository.find();
  }

  findOne(id: string) {
    return this.rolRepository.findOneBy({ id_rol: id });
  }

  update(id: string, updateRolDto: UpdateRolDto) {
    return this.rolRepository.update(id, updateRolDto);
  }

  remove(id: string) {
    return this.rolRepository.delete(id);
  }
}
