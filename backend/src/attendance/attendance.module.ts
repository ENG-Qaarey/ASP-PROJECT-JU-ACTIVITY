import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule { }
