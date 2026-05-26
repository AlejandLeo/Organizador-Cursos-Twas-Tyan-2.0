import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoporteController } from './soporte.controller';
import { SoporteService } from './soporte.service';
import { SolicitudSoporte } from './entities/solicitud-soporte.entity';

import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolicitudSoporte]),
    MailModule,
  ],
  controllers: [SoporteController],
  providers: [SoporteService],
  exports: [SoporteService],
})
export class SoporteModule {}
