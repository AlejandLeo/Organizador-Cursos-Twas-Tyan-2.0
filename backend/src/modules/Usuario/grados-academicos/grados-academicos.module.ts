import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradoAcademico } from './entities/grado-academico.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GradoAcademico])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class GradosAcademicosModule {}
