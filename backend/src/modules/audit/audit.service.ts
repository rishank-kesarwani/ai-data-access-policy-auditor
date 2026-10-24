import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUDIT_REPOSITORY } from '../storage/storage.module';
import { IAuditRepository } from '../storage/storage.types';
import { AuditRecord, AuditVerificationReport } from '../../common/types';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepo: IAuditRepository,
  ) {}

  async getAuditRecords(query: AuditQueryDto): Promise<{
    records: AuditRecord[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { records, total } = await this.auditRepo.getRecords(query);
    return {
      records,
      total,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };
  }

  async getAuditRecordById(id: string): Promise<AuditRecord> {
    const record = await this.auditRepo.getRecordById(id);
    if (!record) {
      throw new NotFoundException(`Audit record with ID '${id}' not found`);
    }
    return record;
  }

  async verifyChainIntegrity(): Promise<AuditVerificationReport> {
    return this.auditRepo.verifyIntegrity();
  }
}
