import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (ConfigService: ConfigService) => {
        return {
          secret: ConfigService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '8h' },
        };
      },
    }),
  ],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule { }
