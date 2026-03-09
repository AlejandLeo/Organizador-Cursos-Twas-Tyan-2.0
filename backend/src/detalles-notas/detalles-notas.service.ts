import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleNota } from './entities/detalle-nota.entity';
import { CreateDetalleNotaDto } from './dto/create-detalle-nota.dto';
import { UpdateDetalleNotaDto } from './dto/update-detalle-nota.dto';

@Injectable()
export class DetallesNotasService {
  constructor(
    @InjectRepository(DetalleNota)
    private readonly detalleNotaRepository: Repository<DetalleNota>,
  ) {}

  create(createDetalleNotaDto: CreateDetalleNotaDto) {
    return this.detalleNotaRepository.save(createDetalleNotaDto);
  }

  findAll() {
    return this.detalleNotaRepository.find();
  }

  findOne(id: string) {
    return this.detalleNotaRepository.findOneBy({ id_detalle_nota: id });
  }

  update(id: string, updateDetalleNotaDto: UpdateDetalleNotaDto) {
    return this.detalleNotaRepository.update(id, updateDetalleNotaDto);
  }

  remove(id: string) {
    return this.detalleNotaRepository.delete(id);
  }
}
