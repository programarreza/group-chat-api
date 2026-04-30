import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { DB_CONNECTION } from '../constants';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq, desc, lt, and } from 'drizzle-orm';
import { RedisService, SessionUser } from '../redis/redis.service';
import * as crypto from 'crypto';
import type { RedisClientType } from 'redis';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { REDIS_CLIENT } from '../constants';

@Injectable()
export class RoomsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    private readonly redisService: RedisService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async getRooms() {
    const rooms = await this.db.query.rooms.findMany();
    const roomsWithUsers = await Promise.all(rooms.map(async (room) => {
      const activeUsers = await this.redisService.countActiveUsersInRoom(room.id);
      return { ...room, activeUsers };
    }));
    return { rooms: roomsWithUsers };
  }

  async createRoom(dto: CreateRoomDto, user: SessionUser) {
    const existing = await this.db.query.rooms.findFirst({
      where: eq(schema.rooms.name, dto.name),
    });

    if (existing) {
      throw new HttpException({
        code: 'ROOM_NAME_TAKEN',
        message: 'A room with this name already exists',
      }, HttpStatus.CONFLICT);
    }

    const id = `room_${crypto.randomBytes(3).toString('hex')}`;
    const result = await this.db.insert(schema.rooms).values({
      id,
      name: dto.name,
      createdBy: user.username,
    }).returning();

    return result[0];
  }

  async getRoom(id: string) {
    const room = await this.db.query.rooms.findFirst({
      where: eq(schema.rooms.id, id),
    });

    if (!room) {
      throw new HttpException({
        code: 'ROOM_NOT_FOUND',
        message: `Room with id ${id} does not exist`,
      }, HttpStatus.NOT_FOUND);
    }

    const activeUsers = await this.redisService.countActiveUsersInRoom(id);
    return { ...room, activeUsers };
  }

  async deleteRoom(id: string, user: SessionUser) {
    const room = await this.db.query.rooms.findFirst({
      where: eq(schema.rooms.id, id),
    });

    if (!room) {
      throw new HttpException({
        code: 'ROOM_NOT_FOUND',
        message: `Room with id ${id} does not exist`,
      }, HttpStatus.NOT_FOUND);
    }

    if (room.createdBy !== user.username) {
      throw new HttpException({
        code: 'FORBIDDEN',
        message: 'Only the room creator can delete this room',
      }, HttpStatus.FORBIDDEN);
    }

    // Delete messages first
    await this.db.delete(schema.messages).where(eq(schema.messages.roomId, id));
    // Delete room
    await this.db.delete(schema.rooms).where(eq(schema.rooms.id, id));

    // Publish room:deleted event
    await this.redisClient.publish('chat_events', JSON.stringify({
      event: 'room:deleted',
      roomId: id,
    }));

    return { deleted: true };
  }

  async getMessages(roomId: string, limit: number = 50, before?: string) {
    const room = await this.db.query.rooms.findFirst({
      where: eq(schema.rooms.id, roomId),
    });

    if (!room) {
      throw new HttpException({
        code: 'ROOM_NOT_FOUND',
        message: `Room with id ${roomId} does not exist`,
      }, HttpStatus.NOT_FOUND);
    }

    const maxLimit = Math.min(limit, 100);

    let whereClause = eq(schema.messages.roomId, roomId);
    if (before) {
      // For cursor pagination: we assume `id` sorting, but timestamps are better. 
      // If `before` is a message ID, we need its timestamp.
      const cursorMsg = await this.db.query.messages.findFirst({
        where: eq(schema.messages.id, before)
      });
      if (cursorMsg) {
        whereClause = and(
          eq(schema.messages.roomId, roomId),
          lt(schema.messages.createdAt, cursorMsg.createdAt)
        ) as any; // Cast as any if drizzle types are strict here
      }
    }

    const messages = await this.db.query.messages.findMany({
      where: whereClause,
      orderBy: [desc(schema.messages.createdAt)],
      limit: maxLimit + 1,
    });

    const hasMore = messages.length > maxLimit;
    if (hasMore) {
      messages.pop(); // Remove the extra item
    }
    
    const nextCursor = hasMore ? messages[messages.length - 1].id : null;

    return {
      messages,
      hasMore,
      nextCursor,
    };
  }

  async sendMessage(roomId: string, dto: SendMessageDto, user: SessionUser) {
    const room = await this.db.query.rooms.findFirst({
      where: eq(schema.rooms.id, roomId),
    });

    if (!room) {
      throw new HttpException({
        code: 'ROOM_NOT_FOUND',
        message: `Room with id ${roomId} does not exist`,
      }, HttpStatus.NOT_FOUND);
    }

    const id = `msg_${crypto.randomBytes(3).toString('hex')}`;
    const result = await this.db.insert(schema.messages).values({
      id,
      roomId,
      username: user.username,
      content: dto.content,
    }).returning();

    const message = result[0];

    // Publish message:new event
    await this.redisClient.publish('chat_events', JSON.stringify({
      event: 'message:new',
      roomId,
      payload: {
        id: message.id,
        username: message.username,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      }
    }));

    return message;
  }
}
