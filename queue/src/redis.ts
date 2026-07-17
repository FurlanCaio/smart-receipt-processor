import 'dotenv/config';

import {Redis as IORedis} from 'ioredis';

if(!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not defined in environment variables');
}

export const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => {
  console.log("Redis connected!");
});

connection.on("ready", () => {
  console.log("Redis ready!");
});

connection.on("error", (err) => {
  console.error("Error Redis:", err);
});