import { getImageUrl } from "../util.js";
import mongoose, { type QueryFilter, type SortOrder } from "mongoose";
import { Receipt } from "../../../../../../packages/database/src/models/receipt/Receipt.js";
import type { ReceiptDocument, ReceiptItemDocument } from "../../../../../../packages/database/src/models/receipt/receipt-model.js";
import type { ReceiptCurrency, ReceiptStatus } from "../../../../../../packages/database/src/models/receipt/receipt-types.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getDashboardQuery } from "../queries.js";
import { s3 } from "../../../../../../shared/S3/client.js";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "../../../errors/AppError.js";

export interface PresignedUploadQuery {
  [key: string]: string | undefined;
  fileName?: string;
  contentType?: string;
}

export interface CreateReceiptInput {
  s3Key: string;
}

export interface ReceiptListQuery {
  [key: string]: string | undefined;
  page?: string;
  limit?: string;
  sort?: string;
  order?: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface GetReceiptsInput extends ReceiptListQuery {
  userId: string;
}

interface RawReceiptItem {
  description?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
}

interface RawExtractedData {
  sellerName?: unknown;
  date?: unknown;
  currency?: unknown;
  totalAmount?: unknown;
  taxAmount?: unknown;
  items?: unknown;
}

export interface UpdateReceiptInput {
  name?: unknown;
  extractedData?: RawExtractedData;
}

export interface DeleteManyReceiptsInput {
  ids: string[];
}

type ReceiptUpdate = {
  name?: string;
  extractedData?: Partial<{
    sellerName: string;
    date: string;
    currency: ReceiptCurrency;
    totalAmount: number;
    taxAmount: number;
    items: ReceiptItemDocument[];
  }>;
  updatedAt: Date;
};

function isRawReceiptItem(value: unknown): value is RawReceiptItem {
  return typeof value === "object" && value !== null;
}

const RECEIPT_STATUSES: readonly ReceiptStatus[] = [
  "pending", "processing", "needs_approval", "approved", "rejected", "failed",
];

function isReceiptStatus(value: string): value is ReceiptStatus {
  return RECEIPT_STATUSES.some(status => status === value);
}

async function getDashboard(userId: string) {
  if (!userId) {
    throw new AuthenticationError("Invalid userId", "INVALID_USERID");
  }

  const result = await getDashboardQuery(userId);

  const stats = result.stats || {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
  };
  const graphData = result.graphData;
  const recentReceipts = result.recentReceipts;

  return { stats, graphData, recentReceipts };
}

async function getRecentReceipts(userId: string) {
  if (!userId) {
    throw new AuthenticationError("Invalid user", "INVALID_USER");
  }

  const receipts = await Receipt.find({ userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(3);

  return receipts;
}

async function getReceiptById(receiptId: string, userId: string) {
  if (!receiptId) {
    throw new ValidationError("Invalid Receipt", "INVALID_RECEIPT");
  }

  if (!userId) {
    throw new AuthenticationError("Invalid user", "INVALID_USER");
  }

  const receipt = await Receipt.findOne({
    _id: receiptId,
    userId,
    isDeleted: false,
  });

  if (!receipt) {
    throw new NotFoundError("Receipt not found", "RECEIPT_NOT_FOUND");
  }

  const imageUrl = await getImageUrl(receipt.s3Key);

  return { ...receipt.toObject(), imageUrl };
}

async function getPresignedUploadUrl(userId: string, fileName: string, contentType: string) {
  if (!userId) {
    throw new AuthenticationError("Invalid user", "INVALID_USER");
  }

  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new ValidationError("Invalid file type", "INVALID_FILE_TYPE");
  }

  const key = `uploads/${Date.now()}-${fileName}`;
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new ValidationError("Storage is not configured", "MISSING_BUCKET");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return { presignedUrl, key };
}

async function createReceipt(s3Key: string, userId: string) {
  if (!s3Key) {
    throw new ValidationError("s3Key is required", "MISSING_S3_KEY");
  }

  const count = await Receipt.countDocuments({
    userId,
  });

  if (count >= 3) {
    throw new ValidationError(
      "Demo limit reached: maximum 3 receipts per account",
      "DEMO_LIMIT_REACHED",
    );
  }

  const receipt = await Receipt.create({
    userId,
    s3Key,
    status: "pending",
  });

  return { receiptId: receipt.id };
}

async function getReceipts({
  page = "1",
  limit = "10",
  sort = "createdAt",
  order = "desc",
  search = "",
  status = "",
  startDate,
  endDate,
  userId,
}: GetReceiptsInput) {
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNumber - 1) * limitNumber;

  const baseFilter: QueryFilter<ReceiptDocument> = {
    userId: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
  };
  const filter: QueryFilter<ReceiptDocument> = { ...baseFilter };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate && !isNaN(Date.parse(startDate))) {
      filter.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate && !isNaN(Date.parse(endDate))) {
      filter.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  if (status) {
    if (!isReceiptStatus(status)) {
      throw new ValidationError("Invalid receipt status", "INVALID_STATUS");
    }
    filter.status = status;
  }

  const sortObj: Record<string, SortOrder> = { [sort]: order === "desc" ? -1 : 1 };

  const filterForCounts: QueryFilter<ReceiptDocument> = { ...baseFilter };
  if (filter.createdAt) filterForCounts.createdAt = filter.createdAt;
  if (filter.name) filterForCounts.name = filter.name;

  const [data, total, statusAggregation] = await Promise.all([
    Receipt.find(filter).sort(sortObj).skip(skip).limit(limitNumber).lean(),

    Receipt.countDocuments(filter),

    Receipt.aggregate([
      { $match: filterForCounts },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const countsByStatus: Record<"all" | ReceiptStatus, number> = {
    all: 0,
    pending: 0,
    processing: 0,
    needs_approval: 0,
    approved: 0,
    rejected: 0,
    failed: 0,
  };

  statusAggregation.forEach(({ _id, count }: { _id: ReceiptStatus; count: number }) => {
    if (Object.prototype.hasOwnProperty.call(countsByStatus, _id)) {
      countsByStatus[_id] = count;
    }
  });

  countsByStatus.all = statusAggregation.reduce(
    (sum: number, item: { count: number }) => sum + item.count,
    0,
  );

  return {
    data,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber),
    countsByStatus,
  };
}

async function updateReceiptData(receiptId: string, userId: string, data: UpdateReceiptInput) {
  if (!receiptId)
    throw new ValidationError("Receipt ID is required", "INVALID_RECEIPT");
  if (!userId)
    throw new AuthenticationError("User ID is required", "INVALID_USER");
  if (!data) throw new ValidationError("No data provided", "INVALID_DATA");

  const receipt = await Receipt.findOne({
    _id: receiptId,
    userId,
    isDeleted: false,
  });
  if (!receipt)
    throw new NotFoundError("Receipt not found", "RECEIPT_NOT_FOUND");

  if (receipt.status === "approved") {
    throw new ValidationError(
      "Approved receipts cannot be edited",
      "RECEIPT_LOCKED",
    );
  }

  const updateData: ReceiptUpdate = { updatedAt: new Date() };

  if (data.name !== undefined) {
    const cleanName = String(data.name).trim();
    if (cleanName.length > 100)
      throw new ValidationError(
        "Receipt name blocks max 100 chars",
        "VALIDATION_FAILED",
      );
    updateData.name = cleanName;
  }

  if (data.extractedData && typeof data.extractedData === "object") {
    const incoming = data.extractedData;
    const sanitizedExtracted: NonNullable<ReceiptUpdate["extractedData"]> = {};

    if (incoming.sellerName !== undefined) {
      sanitizedExtracted.sellerName = String(incoming.sellerName)
        .trim()
        .substring(0, 100);
    }

    if (incoming.date !== undefined && incoming.date !== "") {
      const parsedDate = Date.parse(String(incoming.date));
      if (isNaN(parsedDate)) {
        throw new ValidationError("Invalid date format", "INVALID_DATE");
      }
      sanitizedExtracted.date = new Date(parsedDate).toISOString().slice(0, 10);
    } else {
      sanitizedExtracted.date = "";
    }

    if (incoming.currency !== undefined) {
      const allowedCurrencies = ["USD", "EUR", "BRL"];
      if (typeof incoming.currency !== "string" || !allowedCurrencies.includes(incoming.currency)) {
        throw new ValidationError(
          "Invalid currency standard",
          "INVALID_CURRENCY",
        );
      }
      sanitizedExtracted.currency = incoming.currency as ReceiptCurrency;
    }

    const MAX_AMOUNT = 99999999;
    if (incoming.totalAmount !== undefined) {
      const amt = parseFloat(String(incoming.totalAmount)) || 0;
      sanitizedExtracted.totalAmount = Math.min(MAX_AMOUNT, Math.max(0, amt));
    }
    if (incoming.taxAmount !== undefined) {
      const tax = parseFloat(String(incoming.taxAmount)) || 0;
      sanitizedExtracted.taxAmount = Math.min(MAX_AMOUNT, Math.max(0, tax));
    }

    if (Array.isArray(incoming.items)) {
      if (incoming.items.length > 100) {
        throw new ValidationError(
          "Max 100 items allowed per receipt",
          "LIMIT_EXCEEDED",
        );
      }

      sanitizedExtracted.items = incoming.items.filter(isRawReceiptItem).map((item) => {
        const qty = parseFloat(String(item.quantity)) || 0;
        const price = parseFloat(String(item.unitPrice)) || 0;

        return {
          description: String(item.description || "")
            .trim()
            .substring(0, 150),
          quantity: Math.min(99999, Math.max(0, qty)),
          unitPrice: Math.min(MAX_AMOUNT, Math.max(0, price)),
        };
      });
    } else {
      sanitizedExtracted.items = [];
    }

    updateData.extractedData = sanitizedExtracted;
  }

  const updated = await Receipt.findOneAndUpdate(
    { _id: receiptId, userId, isDeleted: false },
    updateData,
    { returnDocument: "after", runValidators: true, context: "query" },
  );

  return updated;
}

async function approveReceipt(receiptId: string, userId: string) {
  if (!receiptId)
    throw new ValidationError("Receipt ID is required", "INVALID_RECEIPT");
  if (!userId)
    throw new AuthenticationError("User ID is required", "INVALID_USER");

  const receipt = await Receipt.findOneAndUpdate(
    { _id: receiptId, userId, isDeleted: false, status: "needs_approval" },
    {
      status: "approved",
      approvedAt: new Date(),
      approvedBy: userId,
      updatedAt: new Date(),
    },
    { returnDocument: "after", runValidators: true, context: "query" },
  );

  if (!receipt) {
    throw new NotFoundError(
      "Receipt not found or cannot be approved",
      "RECEIPT_NOT_FOUND",
    );
  }

  return receipt;
}

async function rejectReceipt(receiptId: string, userId: string) {
  if (!receiptId)
    throw new ValidationError("Receipt ID is required", "INVALID_RECEIPT");
  if (!userId)
    throw new AuthenticationError("User ID is required", "INVALID_USER");

  const receipt = await Receipt.findOneAndUpdate(
    { _id: receiptId, userId, isDeleted: false, status: "needs_approval" },
    {
      status: "rejected",
      rejectedAt: new Date(),
      rejectedBy: userId,
      updatedAt: new Date(),
    },
    { returnDocument: "after", runValidators: true, context: "query" },
  );

  if (!receipt) {
    throw new NotFoundError(
      "Receipt not found or cannot be rejected",
      "RECEIPT_NOT_FOUND",
    );
  }

  return receipt;
}

async function deleteReceipt(receiptId: string, userId: string) {
  if (!receiptId)
    throw new ValidationError("Receipt ID is required", "INVALID_RECEIPT");
  if (!userId)
    throw new AuthenticationError("User ID is required", "INVALID_USER");

  const receipt = await Receipt.findOneAndUpdate(
    { _id: receiptId, userId, isDeleted: false },
    { isDeleted: true },
    { returnDocument: "after" },
  );

  if (!receipt) {
    throw new NotFoundError("Receipt not found", "RECEIPT_NOT_FOUND");
  }
}

async function deleteManyReceipts(receiptIds: string[], userId: string) {
  if (!receiptIds || !receiptIds.length)
    throw new ValidationError(
      "At least one receipt ID is required",
      "MISSING_IDS",
    );
  if (!userId)
    throw new AuthenticationError("User ID is required", "INVALID_USER");

  const result = await Receipt.updateMany(
    { _id: { $in: receiptIds }, userId, isDeleted: false },
    { isDeleted: true },
  );

  return { deleted: result.modifiedCount };
}

async function downloadReceipt(userId: string, receiptId: string) {
  if (!userId)
    throw new AuthenticationError("User ID is required", "INVALID_USER");
  if (!receiptId)
    throw new ValidationError("Receipt ID is required", "INVALID_RECEIPT");

  const receipt = await Receipt.findOne({
    _id: receiptId,
    userId,
    isDeleted: false,
  });

  if (!receipt) {
    throw new NotFoundError("Receipt not found", "RECEIPT_NOT_FOUND");
  }

  const fileName = receipt.s3Key.split("/").pop();
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new ValidationError("Storage is not configured", "MISSING_BUCKET");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: receipt.s3Key,
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

  return { url: signedUrl };
}

async function reopenReceipt(receiptId: string, userId: string) {
  if (!receiptId)
    throw new ValidationError("Receipt ID is required", "INVALID_RECEIPT");
  if (!userId)
    throw new AuthenticationError("User ID is required", "INVALID_USER");

  const receipt = await Receipt.findOneAndUpdate(
    { _id: receiptId, userId, isDeleted: false, status: "approved" },
    {
      status: "needs_approval",
      approvedAt: null,
      approvedBy: null,
      updatedAt: new Date(),
    },
    { returnDocument: "after", runValidators: true, context: "query" },
  );

  if (!receipt) {
    throw new NotFoundError(
      "Receipt not found or cannot be reopened",
      "RECEIPT_NOT_FOUND",
    );
  }

  return receipt;
}

export default {
  createReceipt,
  getPresignedUploadUrl,
  getReceipts,
  getReceiptById,
  updateReceiptData,
  approveReceipt,
  rejectReceipt,
  reopenReceipt,
  getDashboard,
  deleteReceipt,
  deleteManyReceipts,
  getRecentReceipts,
  downloadReceipt,
};
