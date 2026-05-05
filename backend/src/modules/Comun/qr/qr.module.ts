import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QrService } from './qr.service';
import { QrController } from './qr.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key-qr',
      }),
    }),
  ],
  providers: [QrService],
  controllers: [QrController],
  exports: [QrService],
})
export class QrModule {}
