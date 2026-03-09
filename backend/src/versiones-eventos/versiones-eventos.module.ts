import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionesEventosService } from './versiones-eventos.service';
import { VersionesEventosController } from './versiones-eventos.controller';
import { VersionEvento } from './entities/version-evento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VersionEvento])],
  controllers: [VersionesEventosController],
  providers: [VersionesEventosService],
})
export class VersionesEventosModule {}
