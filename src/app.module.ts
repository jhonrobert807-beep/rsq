import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { AmbulancesModule } from './modules/ambulances/ambulances.module';
import { RideRequestsModule } from './modules/ride-requests/ride-requests.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { ChatsModule } from './modules/chats/chats.module';
import { AdminActionsModule } from './modules/admin-actions/admin-actions.module';
import { DriverPerformanceModule } from './modules/driver-performance/driver-performance.module';
import { ParamedicProfilesModule } from './modules/paramedic-profiles/paramedic-profiles.module';
import { AdminStatsModule } from './modules/admin-stats/admin-stats.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'admin'),
      serveRoot: '/admin',
    }),
    ConfigModule, CommonModule, AuthModule, UsersModule, OrganizationsModule, HospitalsModule, AmbulancesModule, RideRequestsModule, DispatchModule, TrackingModule, ChatsModule, AdminActionsModule, DriverPerformanceModule, ParamedicProfilesModule, AdminStatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
