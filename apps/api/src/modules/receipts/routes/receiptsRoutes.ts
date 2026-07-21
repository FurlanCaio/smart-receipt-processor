import { Router } from "express";
import receiptsController from "../controllers/receiptsController.js";
import type { DownloadParams, ReceiptParams } from "../controllers/receiptsController.js";
import type { CreateReceiptInput, DeleteManyReceiptsInput, PresignedUploadQuery, ReceiptListQuery, UpdateReceiptInput } from "../services/receiptService.js";
import { ensureAuthenticated } from "../../../middlewares/ensureAuthenticated.js";
import uploadRateLimit from "../middlewares/receipt-rate-limit.js";

const receiptsRoutes = Router();

receiptsRoutes.get<Record<string, never>, unknown, unknown, ReceiptListQuery>("/", ensureAuthenticated, receiptsController.getReceipts);
receiptsRoutes.get("/health", (_req, res) => { res.status(200).json({ status: "ok" }); });
receiptsRoutes.get("/dashboard", ensureAuthenticated, receiptsController.getDashboard);
receiptsRoutes.get("/recent", ensureAuthenticated, receiptsController.getRecentReceipts);
receiptsRoutes.get<Record<string, never>, unknown, unknown, PresignedUploadQuery>("/presigned-url", uploadRateLimit, ensureAuthenticated, receiptsController.getPresignedUploadUrl);
receiptsRoutes.post<Record<string, never>, unknown, CreateReceiptInput>("/upload", uploadRateLimit, ensureAuthenticated, receiptsController.createReceipt);
receiptsRoutes.get<DownloadParams>("/download/:receiptId", ensureAuthenticated, receiptsController.downloadReceipt);
receiptsRoutes.get<ReceiptParams>("/:id", ensureAuthenticated, receiptsController.getReceiptById);
receiptsRoutes.put<ReceiptParams>("/:id/approve", ensureAuthenticated, receiptsController.approveReceipt);
receiptsRoutes.put<ReceiptParams>("/:id/reject", ensureAuthenticated, receiptsController.rejectReceipt);
receiptsRoutes.put<ReceiptParams>("/:id/reopen", ensureAuthenticated, receiptsController.reopenReceipt);
receiptsRoutes.put<ReceiptParams, unknown, UpdateReceiptInput>("/:id/data", ensureAuthenticated, receiptsController.updateReceiptData);
receiptsRoutes.delete<Record<string, never>, unknown, DeleteManyReceiptsInput>("/", ensureAuthenticated, receiptsController.deleteManyReceipts);
receiptsRoutes.delete<ReceiptParams>("/:id", ensureAuthenticated, receiptsController.deleteReceipt);

export default receiptsRoutes;
