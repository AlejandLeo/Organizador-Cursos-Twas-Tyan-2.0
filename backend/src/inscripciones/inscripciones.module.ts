import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionesService } from './inscripciones.service';
import { InscripcionesController } from './inscripciones.controller';
import { Inscripcion } from './entities/inscripcion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inscripcion])],
  controllers: [InscripcionesController],
  providers: [InscripcionesService],
})
export class InscripcionesModule {}
