require("dotenv").config()
const connection = require("../../../queue/src/redis")
const { Worker } = require("bullmq")
const Receipt = require("../../../packages/database/src/models/Receipt")
const { analyzeImage } = require("../services/openAiService")
const { getImageUrl } = require("../utils")

const worker = new Worker("receipt-queue",
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

      let rawItems = flat.items
      if (!Array.isArray(rawItems)) rawItems = []

      const extractedData = {
        sellerName:  flat.sellerName  ?? null,
        totalAmount: typeof flat.totalAmount === 'number' ? flat.totalAmount : parseFloat(flat.totalAmount) || null,
        date:        flat.date        ?? null,
        taxAmount:   typeof flat.taxAmount === 'number' ? flat.taxAmount : parseFloat(flat.taxAmount) || null,
        currency:    flat.currency    ?? null,
        items: rawItems
          .filter(item => item && typeof item === 'object')
          .map(item => ({
            description: String(item.description ?? ''),
            quantity:    typeof item.quantity === 'number'  ? item.quantity  : parseFloat(item.quantity)  || 1,
            unitPrice:   typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0,
          })),
      }

      await Receipt.findByIdAndUpdate(
        receiptID,
        { extractedData, status: "needs_approval" },
        { returnDocument: "after" }
      )
      
    } catch (error) {
      console.error("Error processing receipt: ", error)
      
      await Receipt.findByIdAndUpdate(receiptID, { status: "failed", errorMessage: error.message }).catch(err => 
        console.error("Failed to update receipt error status:", err)
      )

      throw error 
    }
  },
  { connection }
)

module.exports = worker;