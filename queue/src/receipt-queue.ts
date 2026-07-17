import { Queue } from 'bullmq'
import { connection } from './redis.js'

const receiptQueue = new Queue('receipt-queue', {
  connection
})

console.log("Receipt Queue initialized")

export default receiptQueue