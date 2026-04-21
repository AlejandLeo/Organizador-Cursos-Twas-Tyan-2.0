import { Module } from '@nestjs/common';
import { CoordinadorController } from './coordinador.controller';
import { CoordinadorService } from './coordinador.service';

@Module({
  controllers: [CoordinadorController],
  providers: [CoordinadorService],
})
export class CoordinadorModule {}
