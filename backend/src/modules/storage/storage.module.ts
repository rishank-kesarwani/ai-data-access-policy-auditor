import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryStorageService } from './in-memory-storage.service';
import { MongoStorageService } from './mongo-storage.service';
import {
  ApprovalDocument,
  ApprovalSchema,
  AuditRecordDocument,
  AuditRecordSchema,
  DataSourceDocument,
  DataSourceSchema,
  PolicyDocument,
  PolicySchema,
  WorkflowDocument,
  WorkflowSchema,
} from './schemas';

export const INVENTORY_REPOSITORY = 'INVENTORY_REPOSITORY';
export const POLICY_REPOSITORY = 'POLICY_REPOSITORY';
export const APPROVAL_REPOSITORY = 'APPROVAL_REPOSITORY';
export const AUDIT_REPOSITORY = 'AUDIT_REPOSITORY';

@Global()
@Module({})
export class StorageModule {
  static forRoot(): DynamicModule {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim().length > 0) {
      return {
        module: StorageModule,
        imports: [
          MongooseModule.forRoot(mongoUri, {
            serverSelectionTimeoutMS: 5000,
          }),
          MongooseModule.forFeature([
            { name: WorkflowDocument.name, schema: WorkflowSchema },
            { name: DataSourceDocument.name, schema: DataSourceSchema },
            { name: PolicyDocument.name, schema: PolicySchema },
            { name: ApprovalDocument.name, schema: ApprovalSchema },
            { name: AuditRecordDocument.name, schema: AuditRecordSchema },
          ]),
        ],
        providers: [
          MongoStorageService,
          {
            provide: INVENTORY_REPOSITORY,
            useExisting: MongoStorageService,
          },
          {
            provide: POLICY_REPOSITORY,
            useExisting: MongoStorageService,
          },
          {
            provide: APPROVAL_REPOSITORY,
            useExisting: MongoStorageService,
          },
          {
            provide: AUDIT_REPOSITORY,
            useExisting: MongoStorageService,
          },
        ],
        exports: [
          INVENTORY_REPOSITORY,
          POLICY_REPOSITORY,
          APPROVAL_REPOSITORY,
          AUDIT_REPOSITORY,
          MongoStorageService,
        ],
      };
    }

    // Default In-Memory Storage
    return {
      module: StorageModule,
      imports: [],
      providers: [
        InMemoryStorageService,
        {
          provide: INVENTORY_REPOSITORY,
          useExisting: InMemoryStorageService,
        },
        {
          provide: POLICY_REPOSITORY,
          useExisting: InMemoryStorageService,
        },
        {
          provide: APPROVAL_REPOSITORY,
          useExisting: InMemoryStorageService,
        },
        {
          provide: AUDIT_REPOSITORY,
          useExisting: InMemoryStorageService,
        },
      ],
      exports: [
        INVENTORY_REPOSITORY,
        POLICY_REPOSITORY,
        APPROVAL_REPOSITORY,
        AUDIT_REPOSITORY,
        InMemoryStorageService,
      ],
    };
  }
}
