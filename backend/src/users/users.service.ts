import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as argon2 from 'argon2';
import { LogService } from '../logger/log.service';
import { PROVIDER, User, Role } from '@prisma/client';
import { addDays } from '../utils';

type UserWithRole = User & { role: Role | { name: string } | null };

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LogService,
  ) {}

  private toUserResponse(user: UserWithRole) {
    const { passwordHash, provider, providerId, roleId, ...response } = user;
    return {
      ...response,
      role: user.role ? { name: user.role.name } : null,
    };
  }

  async create(
    dto: CreateUserDto,
  ): Promise<ReturnType<typeof this.toUserResponse>> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      this.logger.warn(
        `User creation failed. Email already exists: ${dto.email}`,
        UsersService.name,
      );
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: await argon2.hash(dto.password),
        provider: PROVIDER.LOCAL,
        role: dto.roleId ? { connect: { id: dto.roleId } } : undefined,
      },
      include: { role: true },
    });

    return this.toUserResponse(user);
  }

  async findById(id: string): Promise<ReturnType<typeof this.toUserResponse>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { select: { name: true } } },
    });

    if (!user) {
      this.logger.warn(`User with id ${id} not found`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.toUserResponse(user);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email },
      include: { role: { select: { name: true } } },
    });

    if (!user) {
      this.logger.warn(`User with email ${email} not found`, UsersService.name);
      return null;
    }

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<ReturnType<typeof this.toUserResponse>> {
    const { roleId, ...rest } = dto as any;
    const roleUpdate =
      roleId === null
        ? { disconnect: true }
        : roleId
          ? { connect: { id: roleId } }
          : undefined;
    const updatedUser = await this.prisma.user.update({
      where: { id: id },
      data: {
        ...rest,
        role: roleUpdate,
      },
      include: { role: true },
    });
    return this.toUserResponse(updatedUser);
  }

  async storeRefreshToken(
    userId: string,
    hashedRefreshToken: string,
    device?: string | null,
    ip?: string | null,
  ): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        isRevoked: false,
        tokenHash: hashedRefreshToken,
        expiresAt: addDays(new Date(), 7),
        device,
        ip,
      },
    });

    this.logger.log(
      `Refresh token stored for user ID: ${userId}`,
      UsersService.name,
    );
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: { id: true, email: true, role: { select: { name: true } } },
        },
      },
    });
  }

  async findRefreshTokensByUserId(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: { id: true, email: true, role: { select: { name: true } } },
        },
      },
    });
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, createdAt: { lt: addDays(new Date(), -30) } }, // Delete revoked tokens older than 30 days
        ],
      },
    });
    return result.count;
  }

  async getActiveSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        device: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async storePasswordResetToken(userId: string, token: string): Promise<void> {
    if (!userId || !token) {
      this.logger.error(
        `Invalid parameters for storing password reset token`,
        UsersService.name,
      );
      throw new InternalServerErrorException('internal server error');
    }

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: await argon2.hash(token),
        expiresAt: new Date(Date.now() + 300000), // 5 minutes
      },
    });
  }

  async invalidateAllUserResetTokens(userId: string): Promise<void> {
    this.logger.debug(
      `Invalidating all reset tokens for user ID: ${userId}`,
      UsersService.name,
    );
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
  }

  async cleanupExpiredResetTokens(): Promise<number> {
    const result = await this.prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  async findPasswordResetToken(token: string) {
    const allTokens = await this.prisma.passwordResetToken.findMany({
      where: {
        expiresAt: { gt: new Date() },
        userId: { not: null },
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    for (const tokenRecord of allTokens) {
      if (await argon2.verify(tokenRecord.tokenHash, token)) {
        return tokenRecord;
      }
    }

    return null;
  }

  async invalidatePasswordResetToken(tokenId: string): Promise<void> {
    await this.prisma.passwordResetToken.delete({
      where: { id: tokenId },
    });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await argon2.hash(newPassword) },
    });
  }
}
