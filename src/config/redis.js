const redis = require("redis");
require("dotenv").config();

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on("connect", () => {
  console.log("Redis client connecting...");
});

client.on("ready", () => {
  console.log("Redis client ready");
});

client.on("error", (err) => {
  console.error("Redis client error:", err.message);
});

client.on("end", () => {
  console.log("Redis client connection ended");
});

const connectRedis = async () => {
  try {
    await client.connect();
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error.message);
    return false;
  }
};

module.exports = { client, connectRedis };
