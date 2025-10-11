import { createClient, type RedisClientType } from 'redis';

const redisClient: RedisClientType = createClient({
    socket: {
        host: process.env.REDIS_HOST || "redis",
        port: 6379
    },
    password: process.env.REDIS_PASSWORD || "redis"
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('Redis connected');
    } catch (err) {
        console.error('Redis connection failed', err);
    }
})();

export default redisClient;
