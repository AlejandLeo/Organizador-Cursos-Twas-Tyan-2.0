import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { MailService } from './mail.service';
import { MailLog } from './entities/mail-log.entity';
import { MailQueue } from './entities/mail-queue.entity';
import { MailQueueService } from './mail-queue.service';

import { MailTemplate } from './entities/mail-template.entity';
import { MailTemplateService } from './mail-template.service';
import { MailTemplateController } from './mail-template.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([MailLog, MailQueue, MailTemplate]),
    
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT'),
          secure: config.get('MAIL_PORT') === '465',
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
          tls: {
            rejectUnauthorized: false, // Permite certificados auto-firmados
          },
        },
        defaults: {
          from: config.get('MAIL_FROM'),
        },
        template: {
          dir: join(process.cwd(), 'src', 'modules', 'Comun', 'mail', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService, MailQueueService, MailTemplateService],
  controllers: [MailTemplateController],
  exports: [MailService, MailQueueService, MailTemplateService],
})
export class MailModule {}

