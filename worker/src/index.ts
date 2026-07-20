import 'dotenv/config';

import mongoose from "mongoose";

import { worker } from "./jobs/processReceiptJob.js";

async function main() {
  const mongoUri = process.env.MONGO_URI;

  if(!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(mongoUri);
}

mongoose.connection.once('open', () => {
  console.log('Worker: Connected to MongoDB!')
})

mongoose.connection.on('error', (err) => {
  console.error('Worker: MongoDB connection error:', err)
})

console.log('Worker: BullMQ worker started, waiting for jobs...')

const shutdown = async (signal: string) => {
  await worker.close();
  await mongoose.connection.close();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

main().catch((err) => {
  process.exit(1);
});
