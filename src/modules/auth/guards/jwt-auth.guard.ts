import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') || 'your_secret_key';
      const payload = jwt.verify(token, secret) as any;

      // Attach user credentials to the request
      request['user'] = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (err) {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
