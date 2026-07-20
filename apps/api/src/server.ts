import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from "../../../packages/database/db.js";

import authRoutes from './modules/auth/routes/authRoutes.js';
import usersRoutes from './modules/users/routes/usersRoutes.js';
import receiptsRoutes from './modules/receipts/routes/receiptsRoutes.js';
import expenseReportRoutes from './modules/expenseReports/routes/expenseReportRoutes.js';
import receiptQueue from "../../../queue/src/receipt-queue.js";

import cookieParser from 'cookie-parser';

const app = express();

connectDB();

app.set('trust proxy', 1)
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(cookieParser())

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/receipts', receiptsRoutes);
app.use('/expense-reports', expenseReportRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ message: 'Internal Server Error' });
});

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(receiptQueue)],
  serverAdapter,
});

function bullBoardAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");

  if (scheme !== "Basic" || !encoded) {
    res.set("WWW-Authenticate", 'Basic realm="Admin"');
    return res.status(401).send("Authentication required");
  }

  const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");

  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    return next();
  }

  res.set("WWW-Authenticate", 'Basic realm="Admin"');
  return res.status(401).send("Invalid credentials");
}

app.use("/admin/queues", bullBoardAuth, serverAdapter.getRouter());

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log("Bull Board:")
  console.log(`http://localhost:${PORT}/admin/queues`)
})