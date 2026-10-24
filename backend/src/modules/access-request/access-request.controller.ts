import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessRequestService } from './access-request.service';
import { EvaluateAccessRequestDto } from './dto/access-request.dto';
import { Public, PublicSimulator } from '../../common/decorators';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';

@ApiTags('Access Request Evaluation & Simulation')
@Controller('access-request')
@UseGuards(CombinedAuthGuard)
export class AccessRequestController {
  constructor(private readonly accessRequestService: AccessRequestService) {}

  @PublicSimulator()
  @Post('evaluate')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Evaluate an access request deterministically with explainable rationale (Synthetic simulation or real authorization check)',
  })
  async evaluateAccessRequest(
    @Body() dto: EvaluateAccessRequestDto,
    @Request() req: any,
  ) {
    const actor = req.user?.email || req.user?.userId || 'anonymous-simulator';
    const isAnonymous = Boolean(req.user?.isAnonymous);
    return this.accessRequestService.evaluateAccessRequest(
      dto,
      actor,
      isAnonymous,
    );
  }

  @PublicSimulator()
  @Post('simulate')
  @ApiOperation({
    summary:
      'Convenience endpoint to simulate a synthetic access request (Allowed in public demo mode)',
  })
  async simulateAccessRequest(
    @Body() dto: EvaluateAccessRequestDto,
    @Request() req: any,
  ) {
    const actor = req.user?.email || req.user?.userId || 'anonymous-simulator';
    const isAnonymous = Boolean(req.user?.isAnonymous);
    return this.accessRequestService.evaluateAccessRequest(
      { ...dto, isSimulation: true },
      actor,
      isAnonymous,
    );
  }

  @Public()
  @Get('scenarios')
  @ApiOperation({
    summary:
      'Get preconfigured walkthrough scenarios demonstrating ALLOW, DENY, and ESCALATE scenarios',
  })
  async getWalkthroughScenarios() {
    return this.accessRequestService.getWalkthroughScenarios();
  }
}
