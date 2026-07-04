const { Queue } = require('bullmq')
const connection = require('../src/redis')

const receiptQueue = new Queue('receipt-queue', {
  connection
})

console.log("Receipt Queue initialized")

module.exports = receiptQueue