import { Module } from '@nestjs/common';
import { RideRequestsService } from './ride-requests.service';
import { RideRequestsController } from './ride-requests.controller';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [DispatchModule],
  controllers: [RideRequestsController],
  providers: [RideRequestsService],
  exports: [RideRequestsService],
})
export class RideRequestsModule {}
