import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, MailModule, NotificationsModule],
  providers: [RemindersService],
})
export class RemindersModule { }
