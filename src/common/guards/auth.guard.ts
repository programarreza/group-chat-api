import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException({
        code: 'UNAUTHORIZED',
        message: 'Missing or expired session token',
      }, HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    const user = await this.redisService.getSession(token);

    if (!user) {
      throw new HttpException({
        code: 'UNAUTHORIZED',
        message: 'Missing or expired session token',
      }, HttpStatus.UNAUTHORIZED);
    }

    request.user = user;
    return true;
  }
}
