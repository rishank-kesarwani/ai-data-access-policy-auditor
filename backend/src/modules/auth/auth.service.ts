import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../common/constants';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    expiresIn: string;
    user: {
      userId: string;
      email: string;
      role: UserRole;
    };
  }> {
    const configuredPassword = this.configService.get<string>('auth.adminPassword');

    if (!dto.password || dto.password !== configuredPassword) {
      throw new UnauthorizedException('Invalid administrative credentials');
    }

    const email = dto.email || 'admin@secops.internal';
    let role = UserRole.ADMIN;

    if (email.toLowerCase().includes('auditor')) {
      role = UserRole.AUDITOR;
    } else if (email.toLowerCase().includes('operator')) {
      role = UserRole.OPERATOR;
    }

    const payload = {
      sub: `usr-${Buffer.from(email).toString('hex').substring(0, 8)}`,
      email,
      role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('auth.jwtSecret'),
      expiresIn: '24h',
    });

    return {
      accessToken,
      expiresIn: '24h',
      user: {
        userId: payload.sub,
        email,
        role,
      },
    };
  }

  getPublicStatus() {
    const publicAccessEnabled =
      this.configService.get<boolean>('publicAccessEnable') ?? false;

    return {
      publicAccessEnabled,
      applicationName: 'AI Data Access & Policy Auditor',
      authRequiredForMutations: true,
      authRequiredForAudit: true,
      authMethodsSupported: ['JWT_BEARER', 'SERVICE_API_KEY'],
    };
  }
}
