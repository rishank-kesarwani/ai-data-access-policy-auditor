import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';

@ApiTags('Policy Governance & Approvals')
@Controller('approvals')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'List all policy approval requests (Protected)' })
  async getAllApprovals() {
    return this.approvalService.getAllApprovals();
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'List pending approval requests (Protected)' })
  async getPendingApprovals() {
    return this.approvalService.getPendingApprovals();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Get details for a specific approval request (Protected)' })
  async getApprovalById(@Param('id') id: string) {
    return this.approvalService.getApprovalById(id);
  }

  @Post(':id/review')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Approve or reject a policy revision (Protected)' })
  async reviewApproval(
    @Param('id') id: string,
    @Body() dto: ReviewApprovalDto,
    @Request() req: any,
  ) {
    const reviewerEmail = req.user?.email || 'admin@secops.internal';
    return this.approvalService.reviewApproval(id, dto, reviewerEmail);
  }
}
