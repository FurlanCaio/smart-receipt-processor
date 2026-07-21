import type { ReceiptItemDocument } from './receipt-model.js';

export type ReceiptStatus = 'pending' | 'processing' | 'needs_approval' | 'approved' | 'rejected' | 'failed';

export interface ReceiptExtractedData {
    sellerName: string | null;
    totalAmount: number | null;
    date: string | null;
    category: string | null;
    taxAmount: number | null;
    currency: ReceiptCurrency | null;
    items: ReceiptItemDocument[];
}

export type ReceiptCurrency = "USD" | "EUR" | "BRL";
