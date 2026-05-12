import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './entities/usuario.entity';
import { Persona } from '../../Usuario/personas/entities/persona.entity';

import { MailModule } from '../../Comun/mail/mail.module';
import { QrModule } from '../../Seguridad/qr/qr.module';

/**
 * El módulo importa TAMBIÉN la entidad Persona porque el servicio
 * necesita el repositorio de Persona para el registro completo (transacción).
 *
 * DataSource se inyecta automáticamente por NestJS/TypeORM cuando
 * el módulo importa TypeOrmModule — no hay que declararlo explícitamente.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Persona]),
    MailModule,
    QrModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
