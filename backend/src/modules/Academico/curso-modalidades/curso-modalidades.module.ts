import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CursoModalidadesService } from './curso-modalidades.service';
import { CursoModalidadesController } from './curso-modalidades.controller';
import { CursoModalidad } from './entities/curso-modalidad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CursoModalidad])],
  controllers: [CursoModalidadesController],
  providers: [CursoModalidadesService],
  exports: [CursoModalidadesService],
})
export class CursoModalidadesModule {}
