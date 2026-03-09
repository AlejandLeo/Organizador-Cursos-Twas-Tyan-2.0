import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoordinacionesService } from './coordinaciones.service';
import { CoordinacionesController } from './coordinaciones.controller';
import { Coordinacion } from './entities/coordinacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coordinacion])],
  controllers: [CoordinacionesController],
  providers: [CoordinacionesService],
})
export class CoordinacionesModule {}
