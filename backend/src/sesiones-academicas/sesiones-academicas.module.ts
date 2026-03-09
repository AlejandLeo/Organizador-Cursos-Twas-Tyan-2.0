import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { SesionesAcademicasController } from './sesiones-academicas.controller';
import { SesionAcademica } from './entities/sesion-academica.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SesionAcademica])],
  controllers: [SesionesAcademicasController],
  providers: [SesionesAcademicasService],
})
export class SesionesAcademicasModule {}
