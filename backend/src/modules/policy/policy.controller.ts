import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PolicyService } from './policy.service';
import { CreatePolicyDto, SubmitApprovalDto } from './dto/policy.dto';
import { Public, Roles } from '../../common/decorators';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { UserRole } from '../../common/constants';

@ApiTags('Policies')
@Controller('policies')
@UseGuards(CombinedAuthGuard)
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all policies across all versions and states' })
  async getAllPolicies() {
    return this.policyService.getAllPolicies();
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'List only currently active policies' })
  async getActivePolicies() {
    return this.policyService.getActivePolicies();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get policy details by ID' })
  async getPolicyById(@Param('id') id: string) {
    return this.policyService.getPolicyById(id);
  }

  @Public()
  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a specific policy' })
  async getPolicyVersions(@Param('id') id: string) {
    return this.policyService.getPolicyVersions(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a new draft policy (Protected)' })
  async createPolicy(@Body() dto: CreatePolicyDto, @Request() req: any) {
    const userEmail = req.user?.email || 'operator@secops.internal';
    return this.policyService.createPolicy(dto, userEmail);
  }

  @Post(':id/version')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a new draft version of an existing policy (Protected)' })
  async createNewVersion(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePolicyDto>,
    @Request() req: any,
  ) {
    const userEmail = req.user?.email || 'operator@secops.internal';
    return this.policyService.createNewVersion(id, dto, userEmail);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Update a draft policy (Protected)' })
  async updatePolicy(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePolicyDto>,
  ) {
    return this.policyService.updatePolicy(id, dto);
  }

  @Post(':id/submit-approval')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Submit policy for governance review and approval (Protected)' })
  async submitForApproval(
    @Param('id') id: string,
    @Body() dto: SubmitApprovalDto,
    @Request() req: any,
  ) {
    const userEmail = req.user?.email || 'operator@secops.internal';
    return this.policyService.submitForApproval(id, dto, userEmail);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a draft or archived policy (Protected - Admin only)' })
  async deletePolicy(@Param('id') id: string) {
    return { success: await this.policyService.deletePolicy(id) };
  }
}
