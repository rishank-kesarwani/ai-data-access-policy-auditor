import { Controller, Get, Head, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators';

@ApiTags('Root & Discovery')
@Controller()
export class AppController {
  @Public()
  @Get()
  @Head()
  @ApiOperation({ summary: 'Service Root & Discovery' })
  getRoot() {
    return {
      status: 'UP',
      application: 'AI Data Access & Policy Auditor',
      version: '1.0.0',
      apiPrefix: '/api/v1',
      documentation: '/api/docs',
      health: '/health',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('favicon.ico')
  @Head('favicon.ico')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Favicon handler' })
  getFavicon() {
    return;
  }
}
