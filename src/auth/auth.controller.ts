import { Controller, Post, Body, Inject } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { DB_CONNECTION } from '../constants';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { RedisService } from '../redis/redis.service';
import * as crypto from 'crypto';

@Controller('api/v1')
export class AuthController {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    private readonly redisService: RedisService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { username } = body;
    
    // Get or create user
    let user = await this.db.query.users.findFirst({
      where: eq(schema.users.username, username),
    });

    if (!user) {
      const id = `usr_${crypto.randomBytes(4).toString('hex')}`;
      const result = await this.db.insert(schema.users).values({
        id,
        username,
      }).returning();
      user = result[0];
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Set session in Redis
    await this.redisService.setSession(sessionToken, {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
    });

    return {
      sessionToken,
      user,
    };
  }
}
