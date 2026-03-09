import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotasService } from './notas.service';
import { NotasController } from './notas.controller';
import { Nota } from './entities/nota.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Nota])],
  controllers: [NotasController],
  providers: [NotasService],
})
export class NotasModule {}
