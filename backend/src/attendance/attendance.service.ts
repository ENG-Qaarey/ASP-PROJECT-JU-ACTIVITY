import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) { }

  async findAll(filters?: {
    activityId?: string;
    studentId?: string;
    status?: AttendanceStatus;
    coordinatorId?: string;
  }) {
    const where: Prisma.AttendanceWhereInput = {};
    if (filters?.activityId) {
      where.activityId = filters.activityId;
    }
    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.coordinatorId) {
      where.activity = { coordinatorId: filters.coordinatorId };
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: {
        markedAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }
    return attendance;
  }

  async getStatsByActivity(activityId: string) {
    const stats = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { activityId },
      _count: true,
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);
  }

  async markAttendance(data: {
    activityId: string;
    studentId: string;
    studentName: string;
    applicationId: string;
    status: AttendanceStatus;
    markedBy: string;
    markedAt?: string;
  }) {
    const markedAt = data.markedAt ? new Date(data.markedAt) : new Date();
    return this.prisma.attendance.upsert({
      where: { applicationId: data.applicationId },
      update: {
        activityId: data.activityId,
        studentId: data.studentId,
        studentName: data.studentName,
        status: data.status,
        markedAt,
        markedBy: data.markedBy,
      },
      create: {
        activityId: data.activityId,
        studentId: data.studentId,
        studentName: data.studentName,
        applicationId: data.applicationId,
        status: data.status,
        markedAt,
        markedBy: data.markedBy,
      },
    });
  }

  async batchMarkAttendance(data: {
    activityId: string;
    attendanceData: Array<{
      studentId: string;
      studentName: string;
      applicationId: string;
      status: AttendanceStatus;
    }>;
    markedBy: string;
    markedAt?: string;
  }) {
    const markedAt = data.markedAt ? new Date(data.markedAt) : new Date();
    const results = await Promise.all(
      data.attendanceData.map(item =>
        this.markAttendance({
          activityId: data.activityId,
          studentId: item.studentId,
          studentName: item.studentName,
          applicationId: item.applicationId,
          status: item.status,
          markedBy: data.markedBy,
          markedAt: markedAt.toISOString(),
        }),
      ),
    );
    return results;
  }

  // QR Attendance logic
  async generateAttendanceToken(activityId: string) {
    try {
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: { qrCodeSecret: true }
      });

      if (!activity) throw new NotFoundException('Activity not found');

      const secret = this.config.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        { activityId, secret: activity.qrCodeSecret || '' },
        secret,
        { expiresIn: '5m' } // QR code valid for 5 minutes
      );

      return { token };
    } catch (error: any) {
      console.error('QR Generation Error:', error);
      throw new BadRequestException(error.message || 'Failed to generate attendance token');
    }
  }

  async markAttendanceByQr(
    studentId: string,
    activityId: string,
    token: string,
    location?: { lat: number; lng: number }
  ) {
    const secret = this.config.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'your-secret-key';

    // 1. Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (e) {
      throw new BadRequestException('Invalid or expired QR code');
    }

    if (decoded.activityId !== activityId) {
      throw new BadRequestException('QR code is not for this activity');
    }

    // 2. Fetch activity and verify secret
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { coordinator: true }
    });

    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.qrCodeSecret !== decoded.secret) {
      throw new BadRequestException('QR code is outdated');
    }

    // 3. Location check (if enabled for activity)
    if (activity.latitude && activity.longitude && activity.radius) {
      if (!location) {
        throw new BadRequestException('Location coordinates required for this activity');
      }

      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        activity.latitude,
        activity.longitude
      );

      if (distance > activity.radius) {
        throw new BadRequestException(`You are too far from the activity location (${Math.round(distance)}m). Required radius: ${activity.radius}m`);
      }
    }

    // 4. Verify application
    const application = await this.prisma.application.findFirst({
      where: {
        studentId: studentId,
        activityId: activityId
      },
      include: { student: true }
    });

    if (!application) {
      throw new BadRequestException('You are not registered for this activity');
    }

    if (application.status !== 'approved') {
      throw new BadRequestException('Your registration is not approved yet');
    }

    // 5. Mark attendance
    return this.markAttendance({
      activityId,
      studentId,
      studentName: application.student.name,
      applicationId: application.id,
      status: AttendanceStatus.present,
      markedBy: activity.coordinatorId, // System marks it as coordinator
    });
  }

  // Haversine formula to calculate distance between two coordinates in meters
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dPhi = ((lat2 - lat1) * Math.PI) / 180;
    const dLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
