import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { DispatchTimeoutService } from './dispatch-timeout.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [DispatchController],
  providers: [DispatchService, DispatchTimeoutService],
  exports: [DispatchService],
})
export class DispatchModule {}
