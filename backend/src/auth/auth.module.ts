import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MailModule } from '../mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [UsersModule, PrismaModule, ConfigModule, AuditLogsModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
