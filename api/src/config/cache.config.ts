import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

export const cacheConfig = async (configService: ConfigService): Promise<CacheModuleOptions> => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const useRedis = isProduction || configService.get('REDIS_HOST');

  if (useRedis) {
    const redisOptions = {
      socket: {
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
      },
      password: configService.get('REDIS_PASSWORD'),
      database: 0,
      ttl: 3600 * 1000, // 1 hour in milliseconds
    };

    return {
      isGlobal: true,
      store: await redisStore(redisOptions),
    };
  }

  // In-memory cache for development without Redis
  return {
    isGlobal: true,
    ttl: 3600, // 1 hour in seconds
    max: 100, // maximum number of items in cache
  };
};