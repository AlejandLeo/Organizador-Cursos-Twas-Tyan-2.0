import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Imparticion } from './entities/imparticion.entity';
import { CreateImparticionDto } from './dto/create-imparticion.dto';
import { UpdateImparticionDto } from './dto/update-imparticion.dto';

@Injectable()
export class ImparticionesService {
  constructor(
    @InjectRepository(Imparticion)
    private readonly imparticionRepository: Repository<Imparticion>,
  ) {}

  create(createImparticionDto: CreateImparticionDto) {
    return this.imparticionRepository.save(createImparticionDto);
  }

  findAll() {
    return this.imparticionRepository.find();
  }

  findOne(id: string) {
    return this.imparticionRepository.findOneBy({ id_imparticion: id });
  }

  update(id: string, updateImparticionDto: UpdateImparticionDto) {
    return this.imparticionRepository.update(id, updateImparticionDto);
  }

  remove(id: string) {
    return this.imparticionRepository.delete(id);
  }
}
