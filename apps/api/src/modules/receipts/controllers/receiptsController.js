const receiptService = require('../services/receiptService');
const receiptProducer = require('../producers/receipt-producer');
const { AppError } = require("../../../errors/AppError");
const handleControllerError = require('../../../middlewares/errorHandler');

async function getDashboard(req, res) {
   try {
      const dashboardData = await receiptService.getDashboard(req.userId);
      res.status(200).json(dashboardData);
   } catch (error) {
      handleControllerError(error, res);
   }
}

async function getRecentReceipts(req, res) {
   try {
      const recentReceipts = await receiptService.getRecentReceipts(req.userId);
      res.status(200).json(recentReceipts);
   } catch (error) {
      handleControllerError(error, res);
   }
}

async function getReceiptById(req, res) {
   try {
      const receiptId = req.params.id;
      const receipt = await receiptService.getReceiptById(receiptId, req.userId);
      res.status(200).json(receipt);
   } catch (error) {
      handleControllerError(error, res);
   }
}

async function getPresignedUploadUrl(req, res) {
  try {
    const { fileName, contentType } = req.query;

    if (!fileName || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'fileName and contentType query params are required',
        code: 'BAD_REQUEST',
      });
    }

    const result = await receiptService.getPresignedUploadUrl(req.userId, fileName, contentType);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function createReceipt(req, res) {
 try {
    const { s3Key } = req.body;

    if (!s3Key) {
      return res.status(400).json({ success: false, message: 's3Key is required', code: 'BAD_REQUEST' });
    }

    const result = await receiptService.createReceipt(s3Key, req.userId);

    await receiptProducer.sendReceiptJob(result.receiptId, req.userId);

    res.status(201).json(result);
 } catch (error) {
    handleControllerError(error, res);
 }
}

async function getReceipts(req, res) {
   try {
      const { page, limit, sort, order, search, status, startDate, endDate } = req.query;
      const userId = req.userId;

      const result = await receiptService.getReceipts({ 
         page, limit, sort, order, search, status, startDate, endDate, userId 
      });
      
      res.status(200).json(result);
   } catch (error) {
      handleControllerError(error, res);
   }
}

async function updateReceiptData(req, res) {
  try {
    const receiptId = req.params.id;
    const result = await receiptService.updateReceiptData(receiptId, req.userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function approveReceipt(req, res) {
   try {
      const receiptId = req.params.id;
      const result = await receiptService.approveReceipt(receiptId, req.userId);
      res.status(200).json(result);
   } catch(error) {
      handleControllerError(error, res);
   }
}

async function rejectReceipt(req, res) {
   try {
      const receiptId = req.params.id;
      const result = await receiptService.rejectReceipt(receiptId, req.userId);
      res.status(200).json(result);
   } catch(error) {
      handleControllerError(error, res);
   }
}

async function deleteReceipt(req, res) {
   try {
      const receiptId = req.params.id;
      await receiptService.deleteReceipt(receiptId, req.userId);
      res.status(200).json({ message: 'Receipt deleted successfully' });
   } catch(error) {
      handleControllerError(error, res);
   }
}

async function deleteManyReceipts(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required', code: 'BAD_REQUEST' });
    }
    const result = await receiptService.deleteManyReceipts(ids, req.userId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function downloadReceipt(req, res) {
    try {
      const userId = req.userId;
      const receiptId = req.params.receiptId;

      const result = await receiptService.downloadReceipt(userId, receiptId);

      res.status(200).json(result);
    } catch (error) {
      handleControllerError(error, res);
    }
}

async function reopenReceipt(req, res) {
  try {
    const receiptId = req.params.id;
    const result = await receiptService.reopenReceipt(receiptId, req.userId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
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
