import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ICalEventStatus } from 'ical-generator';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../authz/jwt-auth.guard';
import { Roles } from '../authz/roles.decorator';
import { RolesGuard } from '../authz/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('coordinatorId') coordinatorId?: string,
  ) {
    return this.activitiesService.findAll(status, category, coordinatorId);
  }

  // ==================== CALENDAR ENDPOINTS (MUST BE BEFORE :id) ====================

  @Get('calendar/view')
  async getCalendarView(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    const where: any = {};

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    const activities = await this.prisma.activity.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        coordinator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        applications: {
          where: { status: 'approved' },
          select: { id: true }
        }
      }
    });

    // Transform to calendar format
    return activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      start: new Date(`${activity.date}T${activity.time}`),
      end: new Date(`${activity.date}T${activity.time}`), // Can add duration later
      location: activity.location,
      category: activity.category,
      status: activity.status,
      capacity: activity.capacity,
      enrolled: activity.enrolled,
      availableSpots: activity.capacity - activity.enrolled,
      coordinator: activity.coordinator,
      approvedStudents: activity.applications.length,
      image: activity.image
    }));
  }

  @Get('calendar/user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserCalendar(
    @Param('userId') userId: string,
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const requestUser = req.user as { id: string; role: string };

    // Only allow users to view their own calendar, unless admin
    if (requestUser.role !== 'admin' && requestUser.id !== userId) {
      throw new ForbiddenException('You can only view your own calendar');
    }

    const where: any = {
      date: {}
    };

    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }

    // Get user's activities (as coordinator or approved applicant)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        activitiesAsCoordinator: {
          where: where.date ? { date: where.date } : {},
          orderBy: { date: 'asc' }
        },
        applications: {
          where: {
            status: 'approved',
            activity: where.date ? { date: where.date } : {}
          },
          include: {
            activity: true
          }
        }
      }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Combine and format activities
    const coordinatorActivities = user.activitiesAsCoordinator.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      start: new Date(`${activity.date}T${activity.time}`),
      end: new Date(`${activity.date}T${activity.time}`),
      location: activity.location,
      category: activity.category,
      status: activity.status,
      role: 'coordinator',
      capacity: activity.capacity,
      enrolled: activity.enrolled
    }));

    const participantActivities = user.applications.map(app => ({
      id: app.activity.id,
      title: app.activity.title,
      description: app.activity.description,
      start: new Date(`${app.activity.date}T${app.activity.time}`),
      end: new Date(`${app.activity.date}T${app.activity.time}`),
      location: app.activity.location,
      category: app.activity.category,
      status: app.activity.status,
      role: 'participant',
      capacity: app.activity.capacity,
      enrolled: app.activity.enrolled
    }));

    return [...coordinatorActivities, ...participantActivities];
  }

  @Get('calendar/export')
  async exportCalendar(
    @Res({ passthrough: false }) res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
  ) {
    const ical = (await import('ical-generator')).default;

    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    let activities;
    if (userId) {
      // Export user-specific calendar
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          activitiesAsCoordinator: {
            where: where.date ? { date: where.date } : {},
            orderBy: { date: 'asc' }
          },
          applications: {
            where: {
              status: 'approved',
              activity: where.date ? { date: where.date } : {}
            },
            include: { activity: true }
          }
        }
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      activities = [
        ...user.activitiesAsCoordinator,
        ...user.applications.map(app => app.activity)
      ];
    } else {
      // Export all activities
      activities = await this.prisma.activity.findMany({
        where,
        orderBy: { date: 'asc' }
      });
    }

    // Create iCal calendar
    const calendar = ical({
      name: 'JU Activity Hub Calendar',
      prodId: '//JU Activity Hub//EN',
      timezone: 'Asia/Riyadh' // Adjust based on your timezone
    });

    // Add events
    activities.forEach(activity => {
      const startDateTime = new Date(`${activity.date}T${activity.time}`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 2); // Default 2 hour duration

      const eventStatus: ICalEventStatus =
        activity.status === 'upcoming' ? ICalEventStatus.CONFIRMED :
          activity.status === 'ongoing' ? ICalEventStatus.TENTATIVE :
            ICalEventStatus.CANCELLED;

      calendar.createEvent({
        start: startDateTime,
        end: endDateTime,
        summary: activity.title,
        description: activity.description,
        location: activity.location,
        categories: [{ name: activity.category }],
        status: eventStatus,
        organizer: {
          name: activity.coordinatorName,
          email: `coordinator@ju-activity-hub.com` // Adjust as needed
        }
      });
    });

    // Send iCal file
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ju-activities.ics"');
    res.send(calendar.toString());
  }

  // ==================== END CALENDAR ENDPOINTS ====================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async create(
    @Req() req: any,
    @Body()
    activityData: {
      title: string;
      description: string;
      category: string;
      date: string;
      time: string;
      location: string;
      capacity: number;
      coordinatorId?: string;
      coordinatorName?: string;
    },
  ) {
    const user = req.user as { id: string; name: string; role: string };

    // Coordinators can only create activities for themselves.
    // Admins may assign the activity to a coordinator.
    let coordinatorId = user.id;
    let coordinatorName = user.name;

    if (user.role === 'admin' && activityData.coordinatorId) {
      const target = await this.prisma.user.findUnique({
        where: { id: activityData.coordinatorId },
        select: { id: true, name: true, role: true },
      });
      if (!target) {
        throw new BadRequestException('Selected coordinator not found');
      }
      if (target.role !== 'coordinator') {
        throw new BadRequestException('Selected user is not a coordinator');
      }
      coordinatorId = target.id;
      coordinatorName = target.name;
    }

    return this.activitiesService.create(
      {
        ...activityData,
        coordinatorId,
        coordinatorName,
      },
      user.id,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body()
    updateData: {
      title?: string;
      description?: string;
      category?: string;
      date?: string;
      time?: string;
      location?: string;
      capacity?: number;
      enrolled?: number;
      status?: string;
      image?: string;
    },
  ) {
    const user = req.user as { id: string; role: string };

    if (user.role === 'coordinator') {
      const activity = await this.activitiesService.findOne(id);
      if (activity.coordinatorId !== user.id) {
        throw new ForbiddenException('You can only modify your own activities');
      }
    }

    return this.activitiesService.update(id, updateData, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'coordinator')
  remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user as { id: string; role: string };
    if (user.role === 'coordinator') {
      return this.activitiesService.findOne(id).then((activity) => {
        if (activity.coordinatorId !== user.id) {
          throw new ForbiddenException('You can only delete your own activities');
        }
        return this.activitiesService.delete(id, user.id);
      });
    }
    return this.activitiesService.delete(id, user.id);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getMembers(@Param('id') id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        coordinator: {
          select: { id: true, name: true, email: true, role: true, avatar: true }
        },
        applications: {
          where: { status: 'approved' },
          select: {
            id: true,
            isAdmin: true,
            student: {
              select: { id: true, name: true, email: true, role: true, avatar: true }
            }
          }
        }
      }
    });

    if (!activity) throw new BadRequestException('Activity not found');

    const members = [
      { ...activity.coordinator, isGroupAdmin: true },
      ...activity.applications.map(app => ({
        ...app.student,
        isGroupAdmin: app.isAdmin,
        applicationId: app.id
      }))
    ];

    return members;
  }

  @Post(':id/admin/:studentId')
  @UseGuards(JwtAuthGuard)
  async toggleAdmin(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if requester is coordinator or already an admin in this group
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      select: { coordinatorId: true }
    });

    if (!activity) throw new BadRequestException('Activity not found');

    let canManage = userRole === 'admin' || activity.coordinatorId === userId;

    if (!canManage) {
      const requesterApp = await this.prisma.application.findUnique({
        where: { studentId_activityId: { studentId: userId, activityId: id } }
      });
      if (requesterApp?.isAdmin) {
        canManage = true;
      }
    }

    if (!canManage) {
      throw new ForbiddenException('You do not have permission to manage admins in this group');
    }

    const targetApp = await this.prisma.application.findUnique({
      where: { studentId_activityId: { studentId, activityId: id } }
    });

    if (!targetApp || targetApp.status !== 'approved') {
      throw new BadRequestException('Student is not an approved member of this group');
    }

    return this.prisma.application.update({
      where: { id: targetApp.id },
      data: { isAdmin: !targetApp.isAdmin }
    });
  }
}
