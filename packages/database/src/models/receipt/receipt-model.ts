import { Types } from 'mongoose';
import type { ReceiptStatus, ReceiptExtractedData } from './receipt-types.js';

export interface ReceiptItemDocument {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface ReceiptDocument {
    name: string;
    userId: Types.ObjectId;
    isDeleted: boolean;
    errorMessage: string | null;
    s3Key: string;
    status: ReceiptStatus;
    extractedData: ReceiptExtractedData | null;
    approvedAt: Date | null;
    approvedBy: Types.ObjectId | null;
    rejectedAt: Date | null;
    rejectedBy: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}
