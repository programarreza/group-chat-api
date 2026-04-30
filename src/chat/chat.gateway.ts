import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DB_CONNECTION } from '../constants';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { RedisService } from '../redis/redis.service';
import { REDIS_CLIENT } from '../constants';
import type { RedisClientType } from 'redis';

@WebSocketGateway({ 
  namespace: '/chat', 
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  allowEIO3: true 
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private subscriberClient: RedisClientType;

  constructor(
    @Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    private readonly redisService: RedisService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
  ) {}

  async onModuleInit() {
    this.subscriberClient = this.redisClient.duplicate();
    await this.subscriberClient.connect();

    await this.subscriberClient.subscribe('chat_events', (message) => {
      const data = JSON.parse(message);
      if (data.event === 'message:new') {
        this.server.to(data.roomId).emit('message:new', data.payload);
      } else if (data.event === 'room:deleted') {
        this.server.to(data.roomId).emit('room:deleted', { roomId: data.roomId });
        // Optionally disconnect clients
        this.server.in(data.roomId).disconnectSockets();
      }
    });
  }

  async onModuleDestroy() {
    await this.subscriberClient.unsubscribe('chat_events');
    await this.subscriberClient.quit();
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;
    const roomId = client.handshake.query.roomId as string;

    if (!token) {
      client.emit('error', { code: '401', message: 'Missing token' });
      return client.disconnect(true);
    }

    const user = await this.redisService.getSession(token);
    if (!user) {
      client.emit('error', { code: '401', message: 'Invalid or expired token' });
      return client.disconnect(true);
    }

    if (!roomId) {
      client.emit('error', { code: '404', message: 'Missing roomId' });
      return client.disconnect(true);
    }

    const room = await this.db.query.rooms.findFirst({
      where: eq(schema.rooms.id, roomId),
    });

    if (!room) {
      client.emit('error', { code: '404', message: 'Room not found' });
      return client.disconnect(true);
    }

    // Attach user to socket for disconnect handler
    (client as any).user = user;
    (client as any).roomId = roomId;

    client.join(roomId);

    await this.redisService.addUserToRoom(roomId, user.username);
    const activeUsers = await this.redisService.getActiveUsersInRoom(roomId);

    // Emit to connecting client
    client.emit('room:joined', { activeUsers });

    // Broadcast to others
    client.to(roomId).emit('room:user_joined', { username: user.username, activeUsers });
  }

  async handleDisconnect(client: Socket) {
    await this.cleanupClient(client);
  }

  @SubscribeMessage('room:leave')
  async handleRoomLeave(@ConnectedSocket() client: Socket) {
    await this.cleanupClient(client);
    client.disconnect(true);
  }

  private async cleanupClient(client: Socket) {
    const user = (client as any).user;
    const roomId = (client as any).roomId;

    if (user && roomId) {
      await this.redisService.removeUserFromRoom(roomId, user.username);
      const activeUsers = await this.redisService.getActiveUsersInRoom(roomId);
      client.to(roomId).emit('room:user_left', { username: user.username, activeUsers });
    }
  }
}
