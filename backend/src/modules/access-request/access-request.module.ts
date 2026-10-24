import { Module } from '@nestjs/common';
import { AccessRequestController } from './access-request.controller';
import { AccessRequestService } from './access-request.service';
import { PolicyModule } from '../policy/policy.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PolicyModule, JwtModule.register({})],
  controllers: [AccessRequestController],
  providers: [AccessRequestService],
  exports: [AccessRequestService],
})
export class AccessRequestModule {}
