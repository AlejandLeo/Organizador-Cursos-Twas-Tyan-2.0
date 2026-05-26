import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventosService } from './eventos.service';
import { EventosController } from './eventos.controller';
import { EventosAdminController } from './eventos-admin.controller';
import { Evento } from './entities/evento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Evento])],
  controllers: [EventosController, EventosAdminController],
  providers: [EventosService],
})
export class EventosModule {}
