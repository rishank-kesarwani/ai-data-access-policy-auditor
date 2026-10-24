import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateDataSourceDto, CreateWorkflowDto } from './dto/inventory.dto';
import { Public, Roles } from '../../common/decorators';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { UserRole } from '../../common/constants';

@ApiTags('Inventory (Workflows & Data Sources)')
@Controller('inventory')
@UseGuards(CombinedAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get('workflows')
  @ApiOperation({ summary: 'List all registered AI workflows' })
  async getWorkflows() {
    return this.inventoryService.getWorkflows();
  }

  @Public()
  @Get('workflows/:id')
  @ApiOperation({ summary: 'Get details for a specific AI workflow' })
  async getWorkflowById(@Param('id') id: string) {
    return this.inventoryService.getWorkflowById(id);
  }

  @Post('workflows')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Register a new AI workflow (Protected)' })
  async createWorkflow(@Body() dto: CreateWorkflowDto) {
    return this.inventoryService.createWorkflow(dto);
  }

  @Put('workflows/:id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Update an existing AI workflow (Protected)' })
  async updateWorkflow(
    @Param('id') id: string,
    @Body() dto: Partial<CreateWorkflowDto>,
  ) {
    return this.inventoryService.updateWorkflow(id, dto);
  }

  @Public()
  @Get('data-sources')
  @ApiOperation({ summary: 'List all cataloged data sources' })
  async getDataSources() {
    return this.inventoryService.getDataSources();
  }

  @Public()
  @Get('data-sources/:id')
  @ApiOperation({ summary: 'Get details for a specific data source' })
  async getDataSourceById(@Param('id') id: string) {
    return this.inventoryService.getDataSourceById(id);
  }

  @Post('data-sources')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Register a new data source (Protected)' })
  async createDataSource(@Body() dto: CreateDataSourceDto) {
    return this.inventoryService.createDataSource(dto);
  }

  @Put('data-sources/:id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Update an existing data source (Protected)' })
  async updateDataSource(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDataSourceDto>,
  ) {
    return this.inventoryService.updateDataSource(id, dto);
  }
}
