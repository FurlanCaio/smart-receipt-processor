import expenseReportService from "../services/expenseReportService.js"
import type { CreateExpenseReportInput, UpdateExpenseReportInput } from "../services/expenseReportService.js"
import { handleControllerError } from "../../../middlewares/errorHandler.js"
import { AuthenticationError } from "../../../errors/AppError.js"
import type { Request, Response} from "express"

export interface ReportParams {
  [key: string]: string;
  id: string;
}

export interface ReportReceiptParams extends ReportParams {
  receiptId: string;
}

export interface AddReceiptBody {
  receiptId: string;
}

function getAuthenticatedUserId(req: { userId?: string }): string {
  if (!req.userId) {
    throw new AuthenticationError("Invalid user", "INVALID_USER");
  }

  return req.userId;
}

async function getExpenseReports(req: Request, res: Response) {
  try {
    const reports = await expenseReportService.getExpenseReports(getAuthenticatedUserId(req));
    res.status(200).json(reports);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function getExpenseReportById(req: Request<ReportParams>, res: Response) {
  try {
    const report = await expenseReportService.getExpenseReportById(
      req.params.id,
      getAuthenticatedUserId(req),
    );
    res.status(200).json(report);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function createExpenseReport(
  req: Request<Record<string, never>, unknown, CreateExpenseReportInput>,
  res: Response,
) {
  try {
    const { name, description, month, project, client, receiptId } = req.body;
    const report = await expenseReportService.createExpenseReport(getAuthenticatedUserId(req), {
      name,
      description,
      month,
      project,
      client,
      receiptId,
    });
    res.status(201).json(report);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function updateExpenseReport(
  req: Request<ReportParams, unknown, UpdateExpenseReportInput>,
  res: Response,
) {
  try {
    const { name, description, month, project, client, status } = req.body;
    const updated = await expenseReportService.updateExpenseReport(
      req.params.id,
      getAuthenticatedUserId(req),
      { name, description, month, project, client, status },
    );
    res.status(200).json(updated);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function deleteExpenseReport(req: Request<ReportParams>, res: Response) {
  try {
    await expenseReportService.deleteExpenseReport(req.params.id, getAuthenticatedUserId(req));
    res.status(200).json({ message: 'Expense report deleted successfully' });
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function addReceiptToReport(
  req: Request<ReportParams, unknown, AddReceiptBody>,
  res: Response,
) {
  try {
    const { receiptId } = req.body;
    const updated = await expenseReportService.addReceiptToReport(
      req.params.id,
      receiptId,
      getAuthenticatedUserId(req),
    );
    res.status(200).json(updated);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function removeReceiptFromReport(req: Request<ReportReceiptParams>, res: Response) {
  try {
    const updated = await expenseReportService.removeReceiptFromReport(
      req.params.id,
      req.params.receiptId,
      getAuthenticatedUserId(req),
    );
    res.status(200).json(updated);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function exportExpenseReportXlsx(req: Request<ReportParams>, res: Response) {
  try {
    const { workbook, reportName } = await expenseReportService.exportExpenseReportXlsx(
      req.params.id,
      getAuthenticatedUserId(req),
    );

    const safeFileName = reportName.replace(/[^a-z0-9_\-\s]/gi, '_');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFileName}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function getApprovedReceipts(req: Request, res: Response) {
  try {
    const receipts = await expenseReportService.getApprovedReceipts(getAuthenticatedUserId(req));
    res.status(200).json(receipts);
  } catch (error) {
    handleControllerError(error, res);
  }
}

export default {
  getExpenseReports,
  getExpenseReportById,
  createExpenseReport,
  updateExpenseReport,
  deleteExpenseReport,
  addReceiptToReport,
  removeReceiptFromReport,
  exportExpenseReportXlsx,
  getApprovedReceipts,
};
