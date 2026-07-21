import receiptService from "../services/receiptService.js";
import type {
  CreateReceiptInput,
  DeleteManyReceiptsInput,
  PresignedUploadQuery,
  ReceiptListQuery,
  UpdateReceiptInput,
} from "../services/receiptService.js";
import { sendReceiptJob } from "../producers/receipt-producer.js";
import { AuthenticationError, ValidationError } from "../../../errors/AppError.js";
import { handleControllerError } from "../../../middlewares/errorHandler.js";
import type { Request, Response } from "express";

export interface ReceiptParams {
  [key: string]: string;
  id: string;
}

export interface DownloadParams {
  [key: string]: string;
  receiptId: string;
}

function getAuthenticatedUserId(req: { userId?: string }): string {
  if (!req.userId) throw new AuthenticationError("Invalid user", "INVALID_USER");
  return req.userId;
}

async function getDashboard(req: Request, res: Response) {
  try { res.status(200).json(await receiptService.getDashboard(getAuthenticatedUserId(req))); }
  catch (error) { handleControllerError(error, res); }
}

async function getRecentReceipts(req: Request, res: Response) {
  try { res.status(200).json(await receiptService.getRecentReceipts(getAuthenticatedUserId(req))); }
  catch (error) { handleControllerError(error, res); }
}

async function getReceiptById(req: Request<ReceiptParams>, res: Response) {
  try { res.status(200).json(await receiptService.getReceiptById(req.params.id, getAuthenticatedUserId(req))); }
  catch (error) { handleControllerError(error, res); }
}

async function getPresignedUploadUrl(
  req: Request<Record<string, never>, unknown, unknown, PresignedUploadQuery>,
  res: Response,
) {
  try {
    const { fileName, contentType } = req.query;
    if (!fileName || !contentType) {
      throw new ValidationError("fileName and contentType are required", "MISSING_UPLOAD_PARAMS");
    }
    res.status(200).json(await receiptService.getPresignedUploadUrl(
      getAuthenticatedUserId(req), fileName, contentType,
    ));
  } catch (error) { handleControllerError(error, res); }
}

async function createReceipt(
  req: Request<Record<string, never>, unknown, CreateReceiptInput>,
  res: Response,
) {
  try {
    if (!req.body.s3Key) throw new ValidationError("s3Key is required", "MISSING_S3_KEY");
    const userId = getAuthenticatedUserId(req);
    const result = await receiptService.createReceipt(req.body.s3Key, userId);
    await sendReceiptJob(result.receiptId, userId);
    res.status(201).json(result);
  } catch (error) { handleControllerError(error, res); }
}

async function getReceipts(
  req: Request<Record<string, never>, unknown, unknown, ReceiptListQuery>,
  res: Response,
) {
  try {
    res.status(200).json(await receiptService.getReceipts({
      ...req.query,
      userId: getAuthenticatedUserId(req),
    }));
  } catch (error) { handleControllerError(error, res); }
}

async function updateReceiptData(
  req: Request<ReceiptParams, unknown, UpdateReceiptInput>,
  res: Response,
) {
  try { res.status(200).json(await receiptService.updateReceiptData(req.params.id, getAuthenticatedUserId(req), req.body)); }
  catch (error) { handleControllerError(error, res); }
}

async function approveReceipt(req: Request<ReceiptParams>, res: Response) {
  try { res.status(200).json(await receiptService.approveReceipt(req.params.id, getAuthenticatedUserId(req))); }
  catch (error) { handleControllerError(error, res); }
}

async function rejectReceipt(req: Request<ReceiptParams>, res: Response) {
  try { res.status(200).json(await receiptService.rejectReceipt(req.params.id, getAuthenticatedUserId(req))); }
  catch (error) { handleControllerError(error, res); }
}

async function reopenReceipt(req: Request<ReceiptParams>, res: Response) {
  try { res.status(200).json(await receiptService.reopenReceipt(req.params.id, getAuthenticatedUserId(req))); }
  catch (error) { handleControllerError(error, res); }
}

async function deleteReceipt(req: Request<ReceiptParams>, res: Response) {
  try {
    await receiptService.deleteReceipt(req.params.id, getAuthenticatedUserId(req));
    res.status(200).json({ message: "Receipt deleted successfully" });
  } catch (error) { handleControllerError(error, res); }
}

async function deleteManyReceipts(
  req: Request<Record<string, never>, unknown, DeleteManyReceiptsInput>,
  res: Response,
) {
  try {
    if (!Array.isArray(req.body.ids) || req.body.ids.length === 0) {
      throw new ValidationError("ids array is required", "MISSING_IDS");
    }
    res.status(200).json(await receiptService.deleteManyReceipts(req.body.ids, getAuthenticatedUserId(req)));
  } catch (error) { handleControllerError(error, res); }
}

async function downloadReceipt(req: Request<DownloadParams>, res: Response) {
  try { res.status(200).json(await receiptService.downloadReceipt(getAuthenticatedUserId(req), req.params.receiptId)); }
  catch (error) { handleControllerError(error, res); }
}

export default {
  createReceipt, getPresignedUploadUrl, getReceipts, getReceiptById,
  updateReceiptData, approveReceipt, rejectReceipt, reopenReceipt,
  getDashboard, deleteReceipt, deleteManyReceipts, getRecentReceipts,
  downloadReceipt,
};
