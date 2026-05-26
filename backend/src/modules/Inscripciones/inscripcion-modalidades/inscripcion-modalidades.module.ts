import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionModalidadesService } from './inscripcion-modalidades.service';
import { InscripcionModalidadesController } from './inscripcion-modalidades.controller';
import { InscripcionModalidad } from './entities/inscripcion-modalidad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InscripcionModalidad])],
  controllers: [InscripcionModalidadesController],
  providers: [InscripcionModalidadesService],
  exports: [InscripcionModalidadesService],
})
export class InscripcionModalidadesModule {}
