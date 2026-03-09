import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Posteo } from './entities/posteo.entity';
import { CreatePosteoDto } from './dto/create-posteo.dto';
import { UpdatePosteoDto } from './dto/update-posteo.dto';

@Injectable()
export class PosteosService {
  constructor(
    @InjectRepository(Posteo)
    private readonly posteoRepository: Repository<Posteo>,
  ) {}

  create(createPosteoDto: CreatePosteoDto) {
    return this.posteoRepository.save(createPosteoDto);
  }

  findAll() {
    return this.posteoRepository.find();
  }

  findOne(id: string) {
    return this.posteoRepository.findOneBy({ id_posteo: id });
  }

  update(id: string, updatePosteoDto: UpdatePosteoDto) {
    return this.posteoRepository.update(id, updatePosteoDto);
  }

  remove(id: string) {
    return this.posteoRepository.delete(id);
  }
}
