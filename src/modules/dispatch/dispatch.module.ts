import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { DispatchTimeoutService } from './dispatch-timeout.service';
import { SmsService } from '../../services/sms.service';
import { AwsSnsService } from '../../services/aws-sns.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [DispatchController],
  providers: [DispatchService, DispatchTimeoutService, SmsService, AwsSnsService],
  exports: [DispatchService],
})
export class DispatchModule {}
