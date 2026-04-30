import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => console.error('Redis Pub Client Error', err));
      subClient.on('error', (err) => console.error('Redis Sub Client Error', err));

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      console.log('RedisIoAdapter: Successfully connected to Redis');
    } catch (err) {
      console.error('RedisIoAdapter: Failed to connect to Redis', err);
      // Fail loudly so we can see it in logs
      throw err;
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
