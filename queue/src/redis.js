require("dotenv").config();

const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL, {
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

module.exports = connection;