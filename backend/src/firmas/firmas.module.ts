import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmasService } from './firmas.service';
import { FirmasController } from './firmas.controller';
import { Firma } from './entities/firma.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Firma])],
  controllers: [FirmasController],
  providers: [FirmasService],
})
export class FirmasModule {}
