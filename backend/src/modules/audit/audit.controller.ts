import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';

@ApiTags('Audit Trail & Chain Verification')
@Controller('audit')
@UseGuards(CombinedAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('records')
  @Roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.OPERATOR)
  @ApiOperation({
    summary:
      'Search and filter immutable access decision audit trail (Protected)',
  })
  async getAuditRecords(@Query() query: AuditQueryDto) {
    return this.auditService.getAuditRecords(query);
  }

  @Get('records/:id')
  @Roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.OPERATOR)
  @ApiOperation({
    summary: 'Get details and hash linkage for a single audit record (Protected)',
  })
  async getAuditRecordById(@Param('id') id: string) {
    return this.auditService.getAuditRecordById(id);
  }

  @Get('verify-integrity')
  @Roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.OPERATOR)
  @ApiOperation({
    summary:
      'Cryptographically verify tamper-evident hash chaining across the entire audit history (Protected)',
  })
  async verifyChainIntegrity() {
    return this.auditService.verifyChainIntegrity();
  }
}
