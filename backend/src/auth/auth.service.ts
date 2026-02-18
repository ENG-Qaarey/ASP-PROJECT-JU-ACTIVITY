import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auditLogs: AuditLogsService,
    private readonly mailService: MailService,
  ) { }

  private signToken(user: { id: string; email: string; role: any; passwordVersion: number }) {
    const secret = this.config.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
    if (!secret) {
      throw new BadRequestException('JWT_SECRET is not configured');
    }

    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        pv: user.passwordVersion,
      },
      secret,
      { expiresIn: '7d' },
    );
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private sanitizeUser(user: any) {
    if (!user) {
      return null;
    }
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async login(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      await this.auditLogs.create({
        action: 'LOGIN_FAILURE',
        actorId: null,
        targetId: null,
        entity: 'auth',
        entityId: null,
        message: `Failed login for ${normalizedEmail}`,
        metadata: { email: normalizedEmail },
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await this.auditLogs.create({
        action: 'LOGIN_FAILURE',
        actorId: user.id,
        targetId: user.id,
        entity: 'auth',
        entityId: null,
        message: `Failed login for ${user.email}`,
        metadata: { email: user.email },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Email verification is disabled. For backward compatibility with existing
    // accounts created under the old flow, auto-activate students on login.
    // Require active status for all roles
    if (user.status !== 'active') {
      throw new UnauthorizedException('Please verify your email to activate your account');
    }

    const token = this.signToken(user);

    await this.auditLogs.create({
      action: 'LOGIN_SUCCESS',
      actorId: user.id,
      targetId: user.id,
      entity: 'auth',
      entityId: null,
      message: `User login: ${user.email}`,
    });

    return { success: true, user: this.sanitizeUser(user), token };
  }

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: 'student' | 'coordinator' | 'admin';
    studentId?: string;
    department?: string;
    avatar?: string;
  }) {
    const role = payload.role ?? 'student';
    if (role !== 'student') {
      throw new BadRequestException('Only student registration is allowed');
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const normalizedEmail = this.normalizeEmail(payload.email);
    const createdUser = await this.usersService.create({
      ...payload,
      email: normalizedEmail,
      role,
      status: 'inactive',
      emailVerified: false,
    });

    // Save verification code details
    await this.prisma.user.update({
      where: { id: createdUser.id },
      data: {
        emailVerificationCodeHash: verificationCodeHash,
        emailVerificationCodeExpiresAt: expiresAt,
      },
    });

    // Send verification email
    try {
      await this.mailService.sendVerificationCode(normalizedEmail, verificationCode);
    } catch (error) {
      console.error('Failed to send registration verification email:', error);
    }

    const createdForToken = await this.prisma.user.findFirst({
      where: { id: createdUser.id },
      select: { id: true, email: true, role: true, passwordVersion: true },
    });

    const token = createdForToken ? this.signToken(createdForToken) : null;

    return {
      success: true,
      user: createdUser,
      email: normalizedEmail,
      token,
    };
  }

  async verifyEmail(email: string, code: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    // Verify code
    if (!user.emailVerificationCodeExpiresAt || user.emailVerificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    const isValid = await bcrypt.compare(code, user.emailVerificationCodeHash || '');
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: 'active',
        emailVerificationCodeHash: null,
        emailVerificationCodeExpiresAt: null,
      },
    });

    const token = this.signToken({
      id: updated.id,
      email: updated.email,
      role: updated.role,
      passwordVersion: updated.passwordVersion,
    });

    return { success: true, user: this.sanitizeUser(updated), token };
  }

  async resendVerification(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (!user.emailVerified || user.status !== 'active') {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationCodeHash: verificationCodeHash,
          emailVerificationCodeExpiresAt: expiresAt,
        },
      });

      // Send email
      await this.mailService.sendVerificationCode(user.email, verificationCode);
    }

    return { success: true };
  }

  async signInWithGoogle(credential: string) {
    if (!credential) {
      throw new BadRequestException('Missing Google credential');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('Google sign-in is not configured');
    }

    let payload;
    try {
      const ticket = await new OAuth2Client(clientId).verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Unable to verify Google account');
    }

    const normalizedEmail = this.normalizeEmail(payload.email);
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    let userForResponse: any;

    if (!existingUser) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      userForResponse = await this.usersService.create({
        name: payload.name || payload.email.split('@')[0],
        email: normalizedEmail,
        password: randomPassword,
        role: 'student',
        status: 'active',
        emailVerified: true,
        department: payload.hd || 'Undergraduate',
        avatar: payload.picture || undefined,
      });
    } else {
      const updated = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          status: 'active',
          emailVerified: true,
          emailVerificationCodeHash: null,
          emailVerificationCodeExpiresAt: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          studentId: true,
          avatar: true,
          department: true,
          joinedAt: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      userForResponse = updated;
    }

    const tokenSource = await this.prisma.user.findUnique({
      where: { id: userForResponse.id },
      select: { id: true, email: true, role: true, passwordVersion: true },
    });
    const token = tokenSource ? this.signToken(tokenSource) : null;

    return { success: true, user: this.sanitizeUser(userForResponse), token };
  }

  async forgotPassword(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      // Don't reveal if user exists for security, but log it
      await this.auditLogs.create({
        action: 'PASSWORD_RESET_REQUEST_FAILURE',
        actorId: null,
        targetId: null,
        entity: 'user',
        entityId: null,
        message: `Password reset requested for non-existent email: ${normalizedEmail}`,
      });
      return { success: true }; // Return success to prevent email enumeration
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeHash = await bcrypt.hash(resetCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordCodeHash: resetCodeHash,
        resetPasswordCodeExpiresAt: expiresAt,
      },
    });

    await this.auditLogs.create({
      action: 'PASSWORD_RESET_REQUEST_SUCCESS',
      actorId: user.id,
      targetId: user.id,
      entity: 'user',
      entityId: user.id,
      message: `Password reset code generated for ${user.email}`,
    });

    // Send reset code via email
    try {
      await this.mailService.sendVerificationCode(user.email, resetCode);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // We don't throw here to avoid revealing user existence/error state to client
    }

    return { success: true };
  }

  async resetPassword(payload: { email: string; code: string; newPassword: string }) {
    const { email, code, newPassword } = payload;

    if (!email || !code || !newPassword) {
      throw new BadRequestException('Missing required fields');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordCodeExpiresAt) {
      throw new BadRequestException('No active reset request found');
    }

    // Verify expiration
    if (user.resetPasswordCodeExpiresAt < new Date()) {
      throw new BadRequestException('Reset code expired');
    }

    // Verify code
    const isCodeValid = await bcrypt.compare(code, user.resetPasswordCodeHash);
    if (!isCodeValid) {
      throw new BadRequestException('Invalid reset code');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordVersion: { increment: 1 },
        resetPasswordCodeHash: null,
        resetPasswordCodeExpiresAt: null,
      },
    });

    await this.auditLogs.create({
      action: 'USER_UPDATE',
      actorId: user.id,
      targetId: user.id,
      entity: 'user',
      entityId: user.id,
      message: `Password reset successfully for ${user.email}`,
    });

    console.log(`✅ PASSWORD RESET SUCCESSFUL FOR: ${user.email}`);
    return { success: true };
  }
}
