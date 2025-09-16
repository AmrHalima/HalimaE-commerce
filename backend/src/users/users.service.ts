import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // create user: connect role by roleId
  async create(dto: CreateUserDto) {
    const { roleId, password, ...rest } = dto;
    const { provider, ...restWithoutProvider } = rest;
    return this.prisma.user.create({
      data: {
        ...restWithoutProvider,
        passwordHash: await argon2.hash(password),
        provider: provider as any, // TODO: Replace 'any' with 'PROVIDER' if we have the enum imported
        role: roleId ? { connect: { id: roleId } } : undefined,
      },
      include: { role: true },
    });
  }

  // find one: include single role
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: { select: { name: true } }},
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email },
      include: { role: { select: { name: true } }},
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const { roleId, ...rest } = dto as any;
    const roleUpdate = roleId === null ? { disconnect: true } : roleId ? { connect: { id: roleId } } : undefined;
    return this.prisma.user.update({
      where: { id: id },
      data: {
        ...rest,
        role: roleUpdate,
      },
      include: { role: true },
    });
  }
}
