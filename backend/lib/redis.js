import Redis from "ioredis";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Debug log
console.log("Redis init - UPSTASH_REDIS_URL:", process.env.UPSTASH_REDIS_URL ? "LOADED" : "NOT LOADED");

let redis;

// Function to create Redis connection
const createRedisClient = () => {
  const redisUrl = process.env.UPSTASH_REDIS_URL;
  
  if (!redisUrl) {
    console.warn("⚠ Redis URL not found in environment variables");
    console.warn("Using mock Redis (fallback mode)");
    return createMockRedis();
  }

  console.log(`Connecting to Redis: ${redisUrl.substring(0, 30)}...`);
  
  try {
    const client = new Redis(redisUrl, {
      tls: {
        rejectUnauthorized: false
      },
      maxRetriesPerRequest: 1,
      connectTimeout: 10000,
      retryStrategy: (times) => {
        if (times > 3) {
          console.log("Redis: Max retries reached, using fallback");
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      }
    });

    // Add event listeners
    client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    client.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    client.on('close', () => {
      console.log('Redis connection closed');
    });

    // Test connection
    client.ping().then(() => {
      console.log('Redis ping successful');
    }).catch(err => {
      console.error('Redis ping failed:', err.message);
    });

    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error.message);
    console.log('Using mock Redis (fallback mode)');
    return createMockRedis();
  }
};

// Create a mock Redis for fallback
const createMockRedis = () => {
  return {
    get: async (key) => {
      console.log(`Mock Redis GET: ${key}`);
      return null;
    },
    set: async (key, value, mode, time) => {
      console.log(`Mock Redis SET: ${key}`);
      return 'OK';
    },
    del: async (key) => {
      console.log(`Mock Redis DEL: ${key}`);
      return 1;
    },
    ping: async () => 'PONG (mock)',
    quit: async () => 'OK',
    on: () => {}, // Mock event listener
    exists: async (key) => {
      console.log(`Mock Redis EXISTS: ${key}`);
      return 0;
    }
  };
};

// Create the Redis client
redis = createRedisClient();

export { redis };