import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VersionEvento } from './entities/version-evento.entity';
import { CreateVersionEventoDto } from './dto/create-version-evento.dto';
import { UpdateVersionEventoDto } from './dto/update-version-evento.dto';

@Injectable()
export class VersionesEventosService {
  constructor(
    @InjectRepository(VersionEvento)
    private readonly versionEventoRepository: Repository<VersionEvento>,
  ) {}

  create(createVersionEventoDto: CreateVersionEventoDto) {
    return this.versionEventoRepository.save(createVersionEventoDto);
  }

  findAll() {
    return this.versionEventoRepository.find();
  }

  findOne(id: string) {
    return this.versionEventoRepository.findOneBy({ id_version_evento: id });
  }

  update(id: string, updateVersionEventoDto: UpdateVersionEventoDto) {
    return this.versionEventoRepository.update(id, updateVersionEventoDto);
  }

  remove(id: string) {
    return this.versionEventoRepository.delete(id);
  }
}
