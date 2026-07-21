import receiptQueue from '../../../../../../queue/src/receipt-queue.js'

export async function sendReceiptJob(receiptID: string, userID: string) {
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

