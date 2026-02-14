import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 10;

// Fields to exclude from responses
const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  verified: true,
  isActive: true,
  locationLat: true,
  locationLng: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    await this.checkUniqueness(dto.email, dto.phone);

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role ?? Role.USER,
        verified: dto.verified ?? false,
      },
      select: userSelect,
    });
  }

  async findAll(filters?: { role?: Role; search?: string }) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email || dto.phone) {
      await this.checkUniqueness(dto.email, dto.phone, id);
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: userSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }

  private async checkUniqueness(
    email?: string,
    phone?: string,
    excludeId?: string,
  ) {
    if (email) {
      const existing = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existing && existing.id !== excludeId) {
        throw new ConflictException('Email already in use');
      }
    }

    if (phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone },
      });
      if (existing && existing.id !== excludeId) {
        throw new ConflictException('Phone number already in use');
      }
    }
  }
}
