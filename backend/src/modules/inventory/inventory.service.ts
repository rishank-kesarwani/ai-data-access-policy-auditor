import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from '../storage/storage.module';
import { IInventoryRepository } from '../storage/storage.types';
import { DataSource, Workflow } from '../../common/types';
import { CreateDataSourceDto, CreateWorkflowDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepo: IInventoryRepository,
  ) {}

  async getWorkflows(): Promise<Workflow[]> {
    return this.inventoryRepo.getWorkflows();
  }

  async getWorkflowById(id: string): Promise<Workflow> {
    const wf = await this.inventoryRepo.getWorkflowById(id);
    if (!wf) {
      throw new NotFoundException(`Workflow with ID '${id}' not found`);
    }
    return wf;
  }

  async createWorkflow(dto: CreateWorkflowDto): Promise<Workflow> {
    const newWorkflow: Workflow = {
      ...dto,
      active: dto.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.inventoryRepo.createWorkflow(newWorkflow);
  }

  async updateWorkflow(id: string, dto: Partial<CreateWorkflowDto>): Promise<Workflow> {
    const updated = await this.inventoryRepo.updateWorkflow(id, dto);
    if (!updated) {
      throw new NotFoundException(`Workflow with ID '${id}' not found`);
    }
    return updated;
  }

  async getDataSources(): Promise<DataSource[]> {
    return this.inventoryRepo.getDataSources();
  }

  async getDataSourceById(id: string): Promise<DataSource> {
    const ds = await this.inventoryRepo.getDataSourceById(id);
    if (!ds) {
      throw new NotFoundException(`Data source with ID '${id}' not found`);
    }
    return ds;
  }

  async createDataSource(dto: CreateDataSourceDto): Promise<DataSource> {
    const newDataSource: DataSource = {
      ...dto,
      tags: dto.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.inventoryRepo.createDataSource(newDataSource);
  }

  async updateDataSource(id: string, dto: Partial<CreateDataSourceDto>): Promise<DataSource> {
    const updated = await this.inventoryRepo.updateDataSource(id, dto);
    if (!updated) {
      throw new NotFoundException(`Data source with ID '${id}' not found`);
    }
    return updated;
  }
}
