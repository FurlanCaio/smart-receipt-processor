const receiptQueue = require('../../../../../../queue/src/receipt-queue')

async function sendReceiptJob(receiptID, userID) {
  await receiptQueue.add('send-receipt', {
    receiptID,
    userID
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  })
}

module.exports = {
  sendReceiptJob
}