const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require("../../../packages/database/db")

const authRoutes = require('./modules/auth/routes/authRoutes');
const usersRoutes = require('./modules/users/routes/usersRoutes');
const receiptsRoutes = require('./modules/receipts/routes/receiptsRoutes');
const expenseReportRoutes = require('./modules/expenseReports/routes/expenseReportRoutes');
const receiptQueue = require("../../../queue/src/receipt-queue")

const cookieParser = require("cookie-parser")

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

app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Internal Server Error' });
});

const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(receiptQueue)],
  serverAdapter,
});

function bullBoardAuth(req, res, next) {
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