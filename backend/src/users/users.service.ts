import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as argon2 from 'argon2';
import { LogService } from '../logger/log.service';
import { PROVIDER, User, Role } from '@prisma/client';
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

  async create(dto: CreateUserDto): Promise<ReturnType<typeof this.toUserResponse>> {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
        this.logger.warn(`User creation failed. Email already exists: ${dto.email}`, UsersService.name);
        throw new ConflictException(`User with email ${dto.email} already exists`);
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
        include: { role: { select: { name: true } }},
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
      include: { role: { select: { name: true } }},
    });

    if (!user) {
      this.logger.warn(`User with email ${email} not found`, UsersService.name);
      return null;
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<ReturnType<typeof this.toUserResponse>> {
    const { roleId, ...rest } = dto as any;
    const roleUpdate = roleId === null ? { disconnect: true } : roleId ? { connect: { id: roleId } } : undefined;
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
}
