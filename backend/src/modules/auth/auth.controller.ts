import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';

@ApiTags('Authentication & Public Access Status')
@Controller('auth')
@UseGuards(CombinedAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Authenticate security operator or auditor to obtain a JWT bearer token',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Get('status')
  @ApiOperation({
    summary:
      'Inspect server-enforced PUBLIC_ACCESS_ENABLE status and auth requirements',
  })
  async getStatus() {
    return this.authService.getPublicStatus();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated operator profile' })
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
