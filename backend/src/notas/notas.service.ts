import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nota } from './entities/nota.entity';
import { CreateNotaDto } from './dto/create-nota.dto';
import { UpdateNotaDto } from './dto/update-nota.dto';

@Injectable()
export class NotasService {
  constructor(
    @InjectRepository(Nota)
    private readonly notaRepository: Repository<Nota>,
  ) {}

  create(createNotaDto: CreateNotaDto) {
    return this.notaRepository.save(createNotaDto);
  }

  findAll() {
    return this.notaRepository.find();
  }

  findOne(id: string) {
    return this.notaRepository.findOneBy({ id_nota: id });
  }

  update(id: string, updateNotaDto: UpdateNotaDto) {
    return this.notaRepository.update(id, updateNotaDto);
  }

  remove(id: string) {
    return this.notaRepository.delete(id);
  }
}
