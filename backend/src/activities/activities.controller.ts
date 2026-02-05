import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
