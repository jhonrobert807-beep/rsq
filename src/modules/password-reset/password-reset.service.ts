import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { CompletePasswordResetDto } from './dto/complete-password-reset.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService) {}

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.emailOrPhone }, { phone: dto.emailOrPhone }],
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate 6-digit OTP
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset code (in real app, store in separate table or cache)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpiresAt: expiresAt,
      },
    });

    // TODO: Send OTP via email/SMS
    // await this.emailService.sendPasswordResetEmail(user.email, resetCode);

    return {
      message: 'Password reset code sent to your email/phone',
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.emailOrPhone }, { phone: dto.emailOrPhone }],
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.resetCode || user.resetCode !== dto.code) {
      throw new BadRequestException('Invalid reset code');
    }

    if (user.resetCodeExpiresAt && user.resetCodeExpiresAt < new Date()) {
      throw new BadRequestException('Reset code has expired');
    }

    return {
      message: 'Reset code verified successfully',
      verified: true,
    };
  }

  async completePasswordReset(dto: CompletePasswordResetDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.emailOrPhone }, { phone: dto.emailOrPhone }],
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.resetCode || user.resetCode !== dto.code) {
      throw new BadRequestException('Invalid reset code');
    }

    if (user.resetCodeExpiresAt && user.resetCodeExpiresAt < new Date()) {
      throw new BadRequestException('Reset code has expired');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiresAt: null,
      },
    });

    return {
      message: 'Password reset completed successfully',
      success: true,
    };
  }

  async updatePassword(
    userId: string,
    dto: UpdatePasswordDto,
    currentUser: any,
  ) {
    // Verify user is updating their own password
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      throw new UnauthorizedException('Cannot update another user\'s password');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password updated successfully',
      success: true,
    };
  }
}
