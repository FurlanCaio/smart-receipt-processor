import 'dotenv/config';
import { connection } from '../../../queue/src/redis.js'
import { Worker } from "bullmq"
import { Receipt } from '../../../packages/database/src/models/receipt/Receipt.js'
import { analyzeImage } from "../services/openAiService.js"
const { getImageUrl } = require("../utils")

interface RawReceiptItem {
  description?: unknown
  quantity?: unknown
  unitPrice?: unknown
}

function isRawReceiptItem(item: unknown): item is RawReceiptItem {
  return typeof item === "object" && item !== null
}

export const worker = new Worker("receipt-queue",
  async job => {
    const { receiptID, userID } = job.data

    try {
      const receipt = await Receipt.findOneAndUpdate(
      {
        _id: receiptID,
        status: { $ne: "processing" }
      },
      {
        status: "processing"
      },
      {
        returnDocument: "after"
      }
    )

      if (!receipt) {
        return
      }

      const imageUrl = await getImageUrl(process.env.AWS_S3_BUCKET_NAME, receipt.s3Key)

      const rawData = await analyzeImage(imageUrl, userID)

      const data =
        typeof rawData === "string"
          ? JSON.parse(rawData)
          : rawData

      const flat = data.extractedData ?? data

      const rawItems: unknown[] = Array.isArray(flat.items) ? flat.items : []

      const extractedData = {
        sellerName:  flat.sellerName  ?? null,
        totalAmount: typeof flat.totalAmount === 'number' ? flat.totalAmount : parseFloat(flat.totalAmount) || null,
        date:        flat.date        ?? null,
        taxAmount:   typeof flat.taxAmount === 'number' ? flat.taxAmount : parseFloat(flat.taxAmount) || null,
        currency:    flat.currency    ?? null,
        items: rawItems
          .filter(isRawReceiptItem)
          .map(item => ({
            description: String(item.description ?? ''),
            quantity:    typeof item.quantity === 'number'  ? item.quantity  : parseFloat(String(item.quantity))  || 1,
            unitPrice:   typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(String(item.unitPrice)) || 0,
          })),
      }

      await Receipt.findByIdAndUpdate(
        receiptID,
        { extractedData, status: "needs_approval" },
        { returnDocument: "after" }
      )
      
    } catch (error) {
      console.error("Error processing receipt: ", error)

      const errorMessage = error instanceof Error ? error.message : String(error)
      
      await Receipt.findByIdAndUpdate(receiptID, { status: "failed", errorMessage }).catch(err => 
        console.error("Failed to update receipt error status:", err)
      )

      throw error 
    }
  },
  { connection }
)
