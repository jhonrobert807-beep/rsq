import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { EmailService } from '../../services/email.service';
import { DriverProfilesService } from '../driver-profiles/driver-profiles.service';
import { ParamedicProfilesService } from '../paramedic-profiles/paramedic-profiles.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, EmailService, DriverProfilesService, ParamedicProfilesService],
  exports: [AuthService, JwtStrategy, RolesGuard],
})
export class AuthModule {}
