import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { ApplicationsModule } from './applications/applications.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AdminsModule } from './admins/admins.module';
import { CoordinatorsModule } from './coordinators/coordinators.module';
import { AuthzModule } from './authz/authz.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { CategoriesModule } from './categories/categories.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthzModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ActivitiesModule,
    ApplicationsModule,
    NotificationsModule,
    AttendanceModule,
    AdminsModule,
    CoordinatorsModule,
    AuditLogsModule,
    CategoriesModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        console.log(`Incoming Request: ${req.method} ${req.url}`);
        next();
      })
      .forRoutes('*');
  }
}
