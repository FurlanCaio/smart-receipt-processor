const { Router } = require('express');
const expenseReportController = require('../controllers/expenseReportController');
const authMiddleware = require('../../../middlewares/ensureAuthenticated');

const expenseReportRoutes = Router();

expenseReportRoutes.get('/approved-receipts', authMiddleware.ensureAuthenticated, expenseReportController.getApprovedReceipts);
expenseReportRoutes.get('/', authMiddleware.ensureAuthenticated, expenseReportController.getExpenseReports);
expenseReportRoutes.post('/', authMiddleware.ensureAuthenticated, expenseReportController.createExpenseReport);
expenseReportRoutes.get('/:id', authMiddleware.ensureAuthenticated, expenseReportController.getExpenseReportById);
expenseReportRoutes.put('/:id', authMiddleware.ensureAuthenticated, expenseReportController.updateExpenseReport);
expenseReportRoutes.delete('/:id', authMiddleware.ensureAuthenticated, expenseReportController.deleteExpenseReport);
expenseReportRoutes.post('/:id/receipts', authMiddleware.ensureAuthenticated, expenseReportController.addReceiptToReport);
expenseReportRoutes.delete('/:id/receipts/:receiptId', authMiddleware.ensureAuthenticated, expenseReportController.removeReceiptFromReport);
expenseReportRoutes.get('/:id/export/xlsx', authMiddleware.ensureAuthenticated, expenseReportController.exportExpenseReportXlsx);

module.exports = expenseReportRoutes;
