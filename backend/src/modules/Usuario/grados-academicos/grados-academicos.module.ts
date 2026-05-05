import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradoAcademico } from './entities/grado-academico.entity';

import { GradosAcademicosService } from './grados-academicos.service';
import { GradosAcademicosController } from './grados-academicos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GradoAcademico])],
  providers: [GradosAcademicosService],
  controllers: [GradosAcademicosController],
  exports: [TypeOrmModule, GradosAcademicosService],
})
export class GradosAcademicosModule {}
