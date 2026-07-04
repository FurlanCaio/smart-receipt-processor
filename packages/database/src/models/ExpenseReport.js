const mongoose = require("mongoose");

const expenseReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxLength: 1000,
    default: null,
  },
  month: {
    type: String,
    default: null,
    match: [/^\d{4}-\d{2}$/, "Please use YYYY-MM format"],
  },
  project: {
    type: String,
    trim: true,
    maxLength: 200,
    default: null,
  },
  client: {
    type: String,
    trim: true,
    maxLength: 200,
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "completed"],
    default: "draft",
  },
  receiptIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
    },
  ],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
});

expenseReportSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });

const ExpenseReport = mongoose.model("ExpenseReport", expenseReportSchema);

module.exports = ExpenseReport;
