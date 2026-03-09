import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreInscripcionesService } from './pre-inscripciones.service';
import { PreInscripcionesController } from './pre-inscripciones.controller';
import { PreInscripcion } from './entities/pre-inscripcion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PreInscripcion])],
  controllers: [PreInscripcionesController],
  providers: [PreInscripcionesService],
})
export class PreInscripcionesModule {}
