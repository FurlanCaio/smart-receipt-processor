const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  description: { type: String, trim: true, maxlength: 150 },
  quantity: { type: Number, min: 0, default: 1 },
  unitPrice: { type: Number, min: 0, default: 0 }
}, { _id: false });

const receiptSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    default: "New Receipt",
    trim: true,
    maxlength: 100 
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isDeleted: { type: Boolean, default: false, index: true },
  errorMessage: { type: String, trim: true, maxlength: 500, default: null },
  s3Key: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'needs_approval', 'approved', 'rejected', 'failed'], 
    default: 'pending',
    index: true
  },
  extractedData: {
    sellerName: { type: String, trim: true, maxlength: 100 },
    totalAmount: { type: Number, min: 0, default: 0 },
    date: { 
      type: String, 
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Please use YYYY-MM-DD format']
    },
    category: { type: String, trim: true, maxlength: 50 },
    taxAmount: { type: Number, min: 0, default: 0 },
    currency: { 
      type: String, 
      enum: ['USD', 'EUR', 'BRL'],
      uppercase: true,
      trim: true 
    },
    items: [receiptItemSchema]
  },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectedAt: { type: Date, default: null },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { 
  timestamps: true
});

receiptSchema.index({ userId: 1, isDeleted: 1, status: 1 });

const Receipt = mongoose.model('Receipt', receiptSchema);

module.exports = Receipt;