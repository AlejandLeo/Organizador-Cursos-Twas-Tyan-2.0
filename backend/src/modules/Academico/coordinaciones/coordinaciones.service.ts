import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoordinacionEvento } from './entities/coordinacion.entity';

@Injectable()
export class CoordinacionesService {
  constructor(
    @InjectRepository(CoordinacionEvento)
    private readonly coordinacionRepository: Repository<CoordinacionEvento>,
  ) {}

  create(data: Partial<CoordinacionEvento>) {
    const coordinacion = this.coordinacionRepository.create(data);
    return this.coordinacionRepository.save(coordinacion);
  }

  findAll() {
    return this.coordinacionRepository.find();
  }

  findOne(id: number) {
    return this.coordinacionRepository.findOneBy({ id: id });
  }

  update(id: number, data: Partial<CoordinacionEvento>) {
    return this.coordinacionRepository.update(id, data);
  }

  remove(id: number) {
    return this.coordinacionRepository.delete(id);
  }

  findByEvento(eventoId: number) {
    return this.coordinacionRepository.find({
      where: { evento: { id: eventoId } },
      relations: ['usuario', 'usuario.persona'],
    });
  }
}
