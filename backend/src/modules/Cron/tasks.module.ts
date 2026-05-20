import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailQueue } from '../Comun/mail/entities/mail-queue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MailQueue])],
  providers: [TasksService],
})
export class TasksModule {}
