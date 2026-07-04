const { Router } = require('express');
const receiptsController = require('../controllers/receiptsController');
const authMiddleware = require("../../../middlewares/ensureAuthenticated");
const uploadRateLimit = require('../middlewares/receipt-rate-limit');

const receiptsRoutes = Router();

receiptsRoutes.get("/", authMiddleware.ensureAuthenticated, receiptsController.getReceipts);
receiptsRoutes.get("/health", (req, res) => { res.status(200).json({ status: 'ok' });});
receiptsRoutes.get("/dashboard", authMiddleware.ensureAuthenticated, receiptsController.getDashboard);
receiptsRoutes.get("/recent", authMiddleware.ensureAuthenticated, receiptsController.getRecentReceipts);
receiptsRoutes.get("/presigned-url", uploadRateLimit, authMiddleware.ensureAuthenticated, receiptsController.getPresignedUploadUrl);
receiptsRoutes.post("/upload", uploadRateLimit, authMiddleware.ensureAuthenticated, receiptsController.createReceipt);
receiptsRoutes.get('/download/:receiptId', authMiddleware.ensureAuthenticated, receiptsController.downloadReceipt);
receiptsRoutes.get("/:id", authMiddleware.ensureAuthenticated, receiptsController.getReceiptById);
receiptsRoutes.put("/:id/approve", authMiddleware.ensureAuthenticated, receiptsController.approveReceipt);
receiptsRoutes.put("/:id/reject", authMiddleware.ensureAuthenticated, receiptsController.rejectReceipt);
receiptsRoutes.put("/:id/reopen", authMiddleware.ensureAuthenticated, receiptsController.reopenReceipt);
receiptsRoutes.put("/:id/data", authMiddleware.ensureAuthenticated, receiptsController.updateReceiptData);
receiptsRoutes.delete("/", authMiddleware.ensureAuthenticated, receiptsController.deleteManyReceipts);
receiptsRoutes.delete("/:id", authMiddleware.ensureAuthenticated, receiptsController.deleteReceipt);


module.exports = receiptsRoutes;