import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.register({
      secret: 'JWT_SECRET',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule { }
