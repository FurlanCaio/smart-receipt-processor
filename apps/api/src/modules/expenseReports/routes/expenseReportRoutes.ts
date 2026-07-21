import { Router } from 'express';
import expenseReportController from '../controllers/expenseReportController.js';
import type { AddReceiptBody, ReportParams, ReportReceiptParams } from '../controllers/expenseReportController.js';
import type { CreateExpenseReportInput, UpdateExpenseReportInput } from '../services/expenseReportService.js';
import { ensureAuthenticated } from '../../../middlewares/ensureAuthenticated.js';

const expenseReportRoutes = Router();

expenseReportRoutes.get('/approved-receipts', ensureAuthenticated, expenseReportController.getApprovedReceipts);
expenseReportRoutes.get('/', ensureAuthenticated, expenseReportController.getExpenseReports);
expenseReportRoutes.post<Record<string, never>, unknown, CreateExpenseReportInput>('/', ensureAuthenticated, expenseReportController.createExpenseReport);
expenseReportRoutes.get<ReportParams>('/:id', ensureAuthenticated, expenseReportController.getExpenseReportById);
expenseReportRoutes.put<ReportParams, unknown, UpdateExpenseReportInput>('/:id', ensureAuthenticated, expenseReportController.updateExpenseReport);
expenseReportRoutes.delete<ReportParams>('/:id', ensureAuthenticated, expenseReportController.deleteExpenseReport);
expenseReportRoutes.post<ReportParams, unknown, AddReceiptBody>('/:id/receipts', ensureAuthenticated, expenseReportController.addReceiptToReport);
expenseReportRoutes.delete<ReportReceiptParams>('/:id/receipts/:receiptId', ensureAuthenticated, expenseReportController.removeReceiptFromReport);
expenseReportRoutes.get<ReportParams>('/:id/export/xlsx', ensureAuthenticated, expenseReportController.exportExpenseReportXlsx);

export default expenseReportRoutes;
