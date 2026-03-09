import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from './entities/perfil.entity';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@Injectable()
export class PerfilesService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
  ) {}

  create(createPerfilDto: CreatePerfilDto) {
    return this.perfilRepository.save(createPerfilDto);
  }

  findAll() {
    return this.perfilRepository.find();
  }

  findOne(id: string) {
    return this.perfilRepository.findOneBy({ id_perfil: id });
  }

  update(id: string, updatePerfilDto: UpdatePerfilDto) {
    return this.perfilRepository.update(id, updatePerfilDto);
  }

  remove(id: string) {
    return this.perfilRepository.delete(id);
  }
}
