import { Module } from '@nestjs/common';
import { PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';
import { PolicyEvaluatorService } from './policy-evaluator.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  controllers: [PolicyController],
  providers: [PolicyService, PolicyEvaluatorService],
  exports: [PolicyService, PolicyEvaluatorService],
})
export class PolicyModule {}
