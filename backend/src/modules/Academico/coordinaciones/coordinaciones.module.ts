import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoordinacionesService } from './coordinaciones.service';
import { CoordinacionesController } from './coordinaciones.controller';
import { CoordinacionEvento } from './entities/coordinacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CoordinacionEvento])],
  controllers: [CoordinacionesController],
  providers: [CoordinacionesService],
})
export class CoordinacionesModule {}
