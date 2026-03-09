import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Firma } from './entities/firma.entity';
import { CreateFirmaDto } from './dto/create-firma.dto';
import { UpdateFirmaDto } from './dto/update-firma.dto';

@Injectable()
export class FirmasService {
  constructor(
    @InjectRepository(Firma)
    private readonly firmaRepository: Repository<Firma>,
  ) {}

  create(createFirmaDto: CreateFirmaDto) {
    return this.firmaRepository.save(createFirmaDto);
  }

  findAll() {
    return this.firmaRepository.find();
  }

  findOne(id: string) {
    return this.firmaRepository.findOneBy({ id_firma: id });
  }

  update(id: string, updateFirmaDto: UpdateFirmaDto) {
    return this.firmaRepository.update(id, updateFirmaDto);
  }

  remove(id: string) {
    return this.firmaRepository.delete(id);
  }
}
