require("dotenv").config();

const {
  S3Client,
  GetObjectCommand
} = require('@aws-sdk/client-s3')

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const s3 = require("../../../../../shared/S3/client").s3;

async function getImageUrl(s3Key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key
  })

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 10
  })

  return signedUrl
}

module.exports = {
  getImageUrl
}