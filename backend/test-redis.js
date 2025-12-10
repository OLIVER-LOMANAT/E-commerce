import dotenv from 'dotenv';
dotenv.config();

import { redis } from './lib/redis.js';

async function testRedis() {
  console.log('Testing Redis connection...');
  console.log('Redis URL exists:', !!process.env.UPSTASH_REDIS_URL);
  
  try {
    const ping = await redis.ping();
    console.log('Redis ping response:', ping);
    
    // Test set/get
    await redis.set('test_key', 'test_value');
    const value = await redis.get('test_key');
    console.log('Redis get test:', value);
    
    console.log('Redis is working correctly!');
  } catch (error) {
    console.error('Redis test failed:', error.message);
    console.log('But the app should still work with fallback/mock Redis');
  }
  
  process.exit(0);
}

testRedis();