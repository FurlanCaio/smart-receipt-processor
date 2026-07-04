const { getImageUrl } = require("../util");
const mongoose = require("mongoose");
const Receipt = require("../../../../../../packages/database/src/models/Receipt");
const User = require("../../../../../../packages/database/src/models/User");
const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getDashboardQuery } = require("../queries");
const { s3 } = require("../../../../../../shared/S3/client");
const {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} = require("../../../errors/AppError");

async function getDashboard(userId) {
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

async function getRecentReceipts(userId) {
  if (!userId) {
    throw new AuthenticationError("Invalid user", "INVALID_USER");
  }

  const receipts = await Receipt.find({ userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(3);

  return receipts;
}

async function getReceiptById(receiptId, userId) {
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

async function getPresignedUploadUrl(userId, fileName, contentType) {
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

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return { presignedUrl, key };
}

async function createReceipt(s3Key, userId) {
  if (!s3Key) {
    throw new ValidationError("s3Key is required", "MISSING_S3_KEY");
  }

  const count = await Receipt.countDocuments({
    userId,
    isDeleted: false,
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
  page = 1,
  limit = 10,
  sort = "createdAt",
  order = "desc",
  search = "",
  status = "",
  startDate,
  endDate,
  userId,
}) {
  const pageNumber = Math.max(1, parseInt(page) || 1);
  const limitNumber = Math.max(1, parseInt(limit) || 10);
  const skip = (pageNumber - 1) * limitNumber;

  const baseFilter = {
    userId: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
  };
  const filter = { ...baseFilter };

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
    filter.status = status;
  }

  const sortObj = { [sort]: order === "desc" ? -1 : 1 };

  const filterForCounts = { ...baseFilter };
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

  const countsByStatus = {
    all: 0,
    pending: 0,
    processing: 0,
    needs_approval: 0,
    approved: 0,
    rejected: 0,
    failed: 0,
  };

  statusAggregation.forEach(({ _id, count }) => {
    if (countsByStatus.hasOwnProperty(_id)) {
      countsByStatus[_id] = count;
    }
  });

  countsByStatus.all = statusAggregation.reduce(
    (sum, item) => sum + item.count,
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

async function updateReceiptData(receiptId, userId, data) {
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

  const updateData = {};

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
    const sanitizedExtracted = {};

    if (incoming.sellerName !== undefined) {
      sanitizedExtracted.sellerName = String(incoming.sellerName)
        .trim()
        .substring(0, 100);
    }

    if (incoming.date !== undefined && incoming.date !== "") {
      const parsedDate = Date.parse(incoming.date);
      if (isNaN(parsedDate)) {
        throw new ValidationError("Invalid date format", "INVALID_DATE");
      }
      sanitizedExtracted.date = new Date(parsedDate)
        .toISOString()
        .split("T")[0];
    } else {
      sanitizedExtracted.date = "";
    }

    if (incoming.currency !== undefined) {
      const allowedCurrencies = ["USD", "EUR", "BRL"];
      if (!allowedCurrencies.includes(incoming.currency)) {
        throw new ValidationError(
          "Invalid currency standard",
          "INVALID_CURRENCY",
        );
      }
      sanitizedExtracted.currency = incoming.currency;
    }

    const MAX_AMOUNT = 99999999;
    if (incoming.totalAmount !== undefined) {
      const amt = parseFloat(incoming.totalAmount) || 0;
      sanitizedExtracted.totalAmount = Math.min(MAX_AMOUNT, Math.max(0, amt));
    }
    if (incoming.taxAmount !== undefined) {
      const tax = parseFloat(incoming.taxAmount) || 0;
      sanitizedExtracted.taxAmount = Math.min(MAX_AMOUNT, Math.max(0, tax));
    }

    if (Array.isArray(incoming.items)) {
      if (incoming.items.length > 100) {
        throw new ValidationError(
          "Max 100 items allowed per receipt",
          "LIMIT_EXCEEDED",
        );
      }

      sanitizedExtracted.items = incoming.items.map((item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;

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

  updateData.updatedAt = new Date();

  const updated = await Receipt.findOneAndUpdate(
    { _id: receiptId, userId, isDeleted: false },
    updateData,
    { returnDocument: "after", runValidators: true, context: "query" },
  );

  return updated;
}

async function approveReceipt(receiptId, userId) {
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

async function rejectReceipt(receiptId, userId) {
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

async function deleteReceipt(receiptId, userId) {
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

async function deleteManyReceipts(receiptIds, userId) {
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

async function downloadReceipt(userId, receiptId) {
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

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: receipt.s3Key,
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

  return { url: signedUrl };
}

async function reopenReceipt(receiptId, userId) {
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

module.exports = {
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
