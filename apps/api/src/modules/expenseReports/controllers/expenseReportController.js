const expenseReportService = require('../services/expenseReportService');
const { AppError } = require('../../../errors/AppError');
const handleControllerError = require('../../../middlewares/errorHandler');

async function getExpenseReports(req, res) {
  try {
    const reports = await expenseReportService.getExpenseReports(req.userId);
    res.status(200).json(reports);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function getExpenseReportById(req, res) {
  try {
    const report = await expenseReportService.getExpenseReportById(
      req.params.id,
      req.userId,
    );
    res.status(200).json(report);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function createExpenseReport(req, res) {
  try {
    const { name, description, month, project, client, receiptId } = req.body;
    const report = await expenseReportService.createExpenseReport(req.userId, {
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

async function updateExpenseReport(req, res) {
  try {
    const { name, description, month, project, client, status } = req.body;
    const updated = await expenseReportService.updateExpenseReport(
      req.params.id,
      req.userId,
      { name, description, month, project, client, status },
    );
    res.status(200).json(updated);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function deleteExpenseReport(req, res) {
  try {
    await expenseReportService.deleteExpenseReport(req.params.id, req.userId);
    res.status(200).json({ message: 'Expense report deleted successfully' });
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function addReceiptToReport(req, res) {
  try {
    const { receiptId } = req.body;
    const updated = await expenseReportService.addReceiptToReport(
      req.params.id,
      receiptId,
      req.userId,
    );
    res.status(200).json(updated);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function removeReceiptFromReport(req, res) {
  try {
    const updated = await expenseReportService.removeReceiptFromReport(
      req.params.id,
      req.params.receiptId,
      req.userId,
    );
    res.status(200).json(updated);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function exportExpenseReportXlsx(req, res) {
  try {
    const { workbook, reportName } = await expenseReportService.exportExpenseReportXlsx(
      req.params.id,
      req.userId,
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

async function getApprovedReceipts(req, res) {
  try {
    const receipts = await expenseReportService.getApprovedReceipts(req.userId);
    res.status(200).json(receipts);
  } catch (error) {
    handleControllerError(error, res);
  }
}

module.exports = {
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
