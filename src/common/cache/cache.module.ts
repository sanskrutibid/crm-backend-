import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          try {
            const store = await redisStore({
              url: redisUrl,
              ttl: 600 * 1000, // default TTL: 10 minutes (in milliseconds)
            });
            console.log('🚀 Redis cache store connection established successfully.');
            return { store };
          } catch (error) {
            console.error('⚠️ Redis connection failed. Falling back to memory store:', error);
          }
        }
        console.log('ℹ️ Memory cache store initialized (REDIS_URL not configured).');
        return {
          store: 'memory',
          ttl: 60 * 1000, // 60 seconds default TTL (in milliseconds)
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class CrmCacheModule {}
