require("dotenv").config();

const mongoose = require("mongoose");

const worker = require("./jobs/processReceiptJob");

async function main() {
  const mongoUri = process.env.MONGO_URI;

  await mongoose.connect(mongoUri);
}

const shutdown = async (signal) => {
  await worker.close();
  await mongoose.connection.close();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

main().catch((err) => {
  process.exit(1);
});
