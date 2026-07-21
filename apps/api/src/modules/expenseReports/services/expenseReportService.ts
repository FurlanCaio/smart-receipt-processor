import mongoose, { Types } from "mongoose";
import ExcelJS from "exceljs";
import { ExpenseReport } from "../../../../../../packages/database/src/models/expense-report/ExpenseReport.js";
import type { ExpenseReportDocument } from "../../../../../../packages/database/src/models/expense-report/expense-report-model.js";
import { Receipt } from "../../../../../../packages/database/src/models/receipt/Receipt.js";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "../../../errors/AppError.js";

export interface CreateExpenseReportInput {
  name: unknown;
  description?: unknown;
  month?: unknown;
  project?: unknown;
  client?: unknown;
  receiptId?: unknown;
}

export interface UpdateExpenseReportInput {
  name?: unknown;
  description?: unknown;
  month?: unknown;
  project?: unknown;
  client?: unknown;
  status?: unknown;
}

type ExpenseReportUpdate = Partial<
  Pick<ExpenseReportDocument, "name" | "description" | "month" | "project" | "client" | "status">
> & { updatedAt: Date };

async function getExpenseReports(userId: string) {
  if (!userId) throw new AuthenticationError("Invalid user", "INVALID_USER");

  const reports = await ExpenseReport.find({ userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .lean();

  const enriched = await Promise.all(
    reports.map(async (report) => {
      const receiptCount = await Receipt.countDocuments({
        _id: { $in: report.receiptIds },
        isDeleted: false,
      });

      return {
        ...report,
        receiptCount,
      };
    }),
  );

  return enriched;
}

async function getExpenseReportById(reportId: string, userId: string) {
  if (!reportId)
    throw new ValidationError("Report ID is required", "INVALID_REPORT");
  if (!userId) throw new AuthenticationError("Invalid user", "INVALID_USER");

  const report = await ExpenseReport.findOne({
    _id: reportId,
    userId,
    isDeleted: false,
  }).lean();

  if (!report)
    throw new NotFoundError("Expense report not found", "REPORT_NOT_FOUND");

  const receipts = await Receipt.find({
    _id: { $in: report.receiptIds },
    isDeleted: false,
  }).lean();

  return {
    ...report,
    receipts,
    receiptCount: receipts.length,
  };
}

async function createExpenseReport(
  userId: string,
  { name, description, month, project, client, receiptId }: CreateExpenseReportInput,
) {
  if (!userId) throw new AuthenticationError("Invalid user", "INVALID_USER");

  if (!name || !String(name).trim())
    throw new ValidationError("Report name is required", "MISSING_NAME");
  const cleanName = String(name).trim().substring(0, 200);

  const cleanDesc = description
    ? String(description).trim().substring(0, 1000)
    : null;
  const cleanProject = project
    ? String(project).trim().substring(0, 200)
    : null;
  const cleanClient = client ? String(client).trim().substring(0, 200) : null;

  let cleanMonth = null;
  if (month) {
    const monthStr = String(month).trim();
    if (/^\d{4}-\d{2}$/.test(monthStr)) {
      cleanMonth = monthStr;
    } else {
      throw new ValidationError(
        "Invalid month format. Expected YYYY-MM",
        "INVALID_MONTH",
      );
    }
  }

  const receiptIds: Types.ObjectId[] = [];
  if (receiptId) {
    const receipt = await Receipt.findOne({
      _id: receiptId,
      userId,
      isDeleted: false,
      status: "approved",
    });

    if (!receipt) {
      throw new NotFoundError(
        "Receipt not found or not approved",
        "RECEIPT_NOT_APPROVED",
      );
    }
    receiptIds.push(receipt._id);
  }

  const report = await ExpenseReport.create({
    name: cleanName,
    description: cleanDesc,
    month: cleanMonth,
    project: cleanProject,
    client: cleanClient,
    userId,
    receiptIds,
    status: "draft",
  });

  return report;
}

async function addReceiptToReport(reportId: string, receiptId: string, userId: string) {
  if (!reportId)
    throw new ValidationError("Report ID is required", "INVALID_REPORT");
  if (!receiptId)
    throw new ValidationError("Receipt ID is required", "INVALID_RECEIPT");
  if (!userId) throw new AuthenticationError("Invalid user", "INVALID_USER");

  const [report, receipt] = await Promise.all([
    ExpenseReport.findOne({ _id: reportId, userId, isDeleted: false }),
    Receipt.findOne({
      _id: receiptId,
      userId,
      isDeleted: false,
      status: "approved",
    }),
  ]);

  if (!report)
    throw new NotFoundError("Expense report not found", "REPORT_NOT_FOUND");
  if (!receipt)
    throw new NotFoundError(
      "Receipt not found or not approved",
      "RECEIPT_NOT_APPROVED",
    );

  if (report.status === "completed") {
    throw new ValidationError(
      "Cannot add receipts to a completed report",
      "REPORT_COMPLETED",
    );
  }

  const alreadyIn = report.receiptIds.some(
    (id) => id.toString() === receiptId.toString(),
  );
  if (alreadyIn) {
    throw new ValidationError(
      "Receipt already in this report",
      "RECEIPT_ALREADY_IN_REPORT",
    );
  }

  const updated = await ExpenseReport.findOneAndUpdate(
    { _id: reportId, userId, isDeleted: false },
    {
      $push: { receiptIds: receipt._id },
      updatedAt: new Date(),
    },
    { returnDocument: "after" },
  );

  return updated;
}

async function removeReceiptFromReport(reportId: string, receiptId: string, userId: string) {
  if (!reportId)
    throw new ValidationError("Report ID is required", "INVALID_REPORT");
  if (!receiptId)
    throw new ValidationError("Receipt ID is required", "INVALID_RECEIPT");
  if (!userId) throw new AuthenticationError("Invalid user", "INVALID_USER");

  const report = await ExpenseReport.findOne({
    _id: reportId,
    userId,
    isDeleted: false,
  });
  if (!report)
    throw new NotFoundError("Expense report not found", "REPORT_NOT_FOUND");

  if (report.status === "completed") {
    throw new ValidationError(
      "Cannot remove receipts from a completed report",
      "REPORT_COMPLETED",
    );
  }

  const updated = await ExpenseReport.findOneAndUpdate(
    { _id: reportId, userId, isDeleted: false },
    {
      $pull: { receiptIds: new mongoose.Types.ObjectId(receiptId) },
      updatedAt: new Date(),
    },
    { returnDocument: "after" },
  );

  return updated;
}

async function updateExpenseReport(
  reportId: string,
  userId: string,
  { name, description, month, project, client, status }: UpdateExpenseReportInput,
) {
  if (!reportId)
    throw new ValidationError("Report ID is required", "INVALID_REPORT");
  if (!userId) throw new AuthenticationError("Invalid user", "INVALID_USER");

  const report = await ExpenseReport.findOne({
    _id: reportId,
    userId,
    isDeleted: false,
  });
  if (!report)
    throw new NotFoundError("Expense report not found", "REPORT_NOT_FOUND");

  if (report.status === "completed" && status !== "draft") {
    throw new ValidationError(
      "Cannot update a completed report",
      "REPORT_LOCKED",
    );
  }

  const updateData: ExpenseReportUpdate = { updatedAt: new Date() };

  if (name !== undefined)
    updateData.name = String(name).trim().substring(0, 200);
  if (description !== undefined)
    updateData.description = description
      ? String(description).trim().substring(0, 1000)
      : null;
  if (project !== undefined)
    updateData.project = project
      ? String(project).trim().substring(0, 200)
      : null;
  if (client !== undefined)
    updateData.client = client ? String(client).trim().substring(0, 200) : null;

  if (month !== undefined) {
    if (month === null || month === "") {
      updateData.month = null;
    } else {
      const monthStr = String(month).trim();
      if (!/^\d{4}-\d{2}$/.test(monthStr)) {
        throw new ValidationError(
          "Invalid month format. Expected YYYY-MM",
          "INVALID_MONTH",
        );
      }
      updateData.month = monthStr;
    }
  }

  if (status !== undefined) {
    if (status !== "draft" && status !== "completed") {
      throw new ValidationError("Invalid status", "INVALID_STATUS");
    }
    updateData.status = status;
  }

  const updated = await ExpenseReport.findOneAndUpdate(
    { _id: reportId, userId, isDeleted: false },
    updateData,
    { returnDocument: "after", runValidators: true, context: "query" },
  );

  return updated;
}

async function deleteExpenseReport(reportId: string, userId: string) {
  if (!reportId)
    throw new ValidationError("Report ID is required", "INVALID_REPORT");
  if (!userId) throw new AuthenticationError("Invalid user", "INVALID_USER");

  const report = await ExpenseReport.findOneAndUpdate(
    { _id: reportId, userId, isDeleted: false },
    { isDeleted: true, updatedAt: new Date() },
    { returnDocument: "after" },
  );

  if (!report)
    throw new NotFoundError("Expense report not found", "REPORT_NOT_FOUND");
}

async function exportExpenseReportXlsx(reportId: string, userId: string) {
  if (!reportId)
    throw new ValidationError("Report ID is required", "INVALID_REPORT");
  if (!userId) throw new AuthenticationError("Invalid user", "INVALID_USER");

  const report = await ExpenseReport.findOne({
    _id: reportId,
    userId,
    isDeleted: false,
  }).lean();
  if (!report)
    throw new NotFoundError("Expense report not found", "REPORT_NOT_FOUND");

  const receipts = await Receipt.find({
    _id: { $in: report.receiptIds },
    isDeleted: false,
  }).lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Expense Report");

  const headerFill: ExcelJS.FillPattern = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A6E" },
  };
  const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  const headerAlignment: Partial<ExcelJS.Alignment> = {
    vertical: "middle",
    horizontal: "center",
  };

  sheet.columns = [
    { header: "Date", key: "date", width: 16 },
    { header: "Merchant", key: "merchant", width: 28 },
    { header: "Total", key: "total", width: 14 },
    { header: "Tax", key: "tax", width: 12 },
    { header: "Currency", key: "currency", width: 12 },
    { header: "Items", key: "items", width: 40 },
    { header: "Receipt Name", key: "receiptName", width: 24 },
    { header: "Approved At", key: "approvedAt", width: 20 },
  ];

  sheet.getRow(1).eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = headerAlignment;
  });

  for (const r of receipts) {
    const itemsSummary = (r.extractedData?.items || [])
      .map(
        (i) =>
          `${i.description || ""} x${i.quantity || 1} @ ${i.unitPrice || 0}`,
      )
      .join("; ");

    sheet.addRow({
      date: r.extractedData?.date || "",
      merchant: r.extractedData?.sellerName || r.name || "",
      total: r.extractedData?.totalAmount ?? "",
      tax: r.extractedData?.taxAmount ?? "",
      currency: r.extractedData?.currency || "",
      items: itemsSummary,
      receiptName: r.name || "",
      approvedAt: r.approvedAt ? new Date(r.approvedAt).toLocaleString() : "",
    });
  }

  return { workbook, reportName: report.name };
}

async function getApprovedReceipts(userId: string) {
  if (!userId) throw new AuthenticationError("Invalid user", "INVALID_USER");

  const receipts = await Receipt.find({
    userId,
    status: "approved",
    isDeleted: false,
  })
    .sort({ approvedAt: -1 })
    .lean();

  return receipts;
}

export default {
  getExpenseReports,
  getExpenseReportById,
  createExpenseReport,
  addReceiptToReport,
  removeReceiptFromReport,
  updateExpenseReport,
  deleteExpenseReport,
  exportExpenseReportXlsx,
  getApprovedReceipts,
};
