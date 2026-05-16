import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionSistema } from './entities/configuracion-sistema.entity';
import { SistemaConfigService } from './sistema-config.service';
import { SistemaConfigController } from './sistema-config.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ConfiguracionSistema])],
  controllers: [SistemaConfigController],
  providers: [SistemaConfigService],
  exports: [SistemaConfigService],
})
export class SistemaConfigModule {}
