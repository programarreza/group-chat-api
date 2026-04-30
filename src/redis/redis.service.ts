import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../constants';
import type { RedisClientType } from 'redis';

export type SessionUser = {
  id: string;
  username: string;
  createdAt: string;
};

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  // Session Management
  async setSession(token: string, user: SessionUser): Promise<void> {
    await this.redisClient.set(`session:${token}`, JSON.stringify(user), {
      EX: 24 * 60 * 60, // 24 hours
    });
  }

  async getSession(token: string): Promise<SessionUser | null> {
    const data = await this.redisClient.get(`session:${token}`);
    if (!data) return null;
    return JSON.parse(data) as SessionUser;
  }

  // Active Users per Room
  async addUserToRoom(roomId: string, username: string): Promise<void> {
    await this.redisClient.sAdd(`room_active_users:${roomId}`, username);
  }

  async removeUserFromRoom(roomId: string, username: string): Promise<void> {
    await this.redisClient.sRem(`room_active_users:${roomId}`, username);
  }

  async getActiveUsersInRoom(roomId: string): Promise<string[]> {
    return this.redisClient.sMembers(`room_active_users:${roomId}`);
  }

  async countActiveUsersInRoom(roomId: string): Promise<number> {
    return this.redisClient.sCard(`room_active_users:${roomId}`);
  }
}
