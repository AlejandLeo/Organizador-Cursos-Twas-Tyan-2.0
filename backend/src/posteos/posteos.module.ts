import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosteosService } from './posteos.service';
import { PosteosController } from './posteos.controller';
import { Posteo } from './entities/posteo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Posteo])],
  controllers: [PosteosController],
  providers: [PosteosService],
})
export class PosteosModule {}
