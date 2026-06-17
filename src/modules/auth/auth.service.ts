import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../../services/email.service';
import { DriverProfilesService } from '../driver-profiles/driver-profiles.service';
import { ParamedicProfilesService } from '../paramedic-profiles/paramedic-profiles.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly driverProfilesService: DriverProfilesService,
    private readonly paramedicProfilesService: ParamedicProfilesService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    // Block self-registration as ADMIN
    if (dto.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot self-register as ADMIN');
    }

    // Check uniqueness
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing) {
        throw new ConflictException('Phone number already in use');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role ?? Role.USER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        verified: true,
        createdAt: true,
      },
    });

    // Auto-create driver or paramedic profile
    if (user.role === Role.DRIVER) {
      try {
        await this.driverProfilesService.create({
          userId: user.id,
          licenseNumber: '',
          experienceYears: 0,
        });
      } catch (e) {
        console.error('Failed to create driver profile:', e);
      }
    } else if (user.role === Role.PARAMEDIC) {
      try {
        await this.paramedicProfilesService.create({
          userId: user.id,
          experienceYears: 0,
        });
      } catch (e) {
        console.error('Failed to create paramedic profile:', e);
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    // Find user by email or phone
    let user;
    if (dto.email) {
      user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    } else {
      user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or deactivated');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
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
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async sendOtp(dto: SendOtpDto) {
    // Check rate limiting - max 1 OTP request per minute
    const recentOtp = await this.prisma.otpCode.findFirst({
      where: {
        identifier: dto.identifier,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }, // Last 1 minute
      },
    });

    if (recentOtp) {
      throw new BadRequestException('Please wait before requesting a new OTP');
    }

    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otpCode.create({
      data: { identifier: dto.identifier, code, expiresAt },
    });

    // Send OTP via email if identifier looks like email
    if (dto.identifier.includes('@')) {
      await this.emailService.sendOtpEmail(dto.identifier, code);
    } else {
      // For phone numbers, log for now (SMS not implemented yet)
      console.log(`OTP for ${dto.identifier}: ${code}`);
    }

    return { message: 'OTP sent successfully. Check your email for the verification code.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    // Brute force protection - check for failed attempts in last 15 minutes
    const failedAttempts = await this.prisma.otpCode.count({
      where: {
        identifier: dto.identifier,
        code: { not: dto.code }, // Count non-matching codes
        expiresAt: { gt: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 minutes
      },
    });

    if (failedAttempts >= 5) {
      throw new BadRequestException('Too many failed attempts. Please request a new OTP and try again.');
    }

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        identifier: dto.identifier,
        code: dto.code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    // Mark user as verified if they exist
    await this.prisma.user.updateMany({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
      data: { verified: true },
    });

    return { verified: true };
  }

  private async generateTokens(
    userId: string,
    email: string | null,
    role: Role,
  ) {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    const accessExpiresIn = this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m');
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...accessPayload },
        { secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: accessExpiresIn },
      ),
      this.jwtService.signAsync(
        { ...refreshPayload },
        { secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: refreshExpiresIn },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
