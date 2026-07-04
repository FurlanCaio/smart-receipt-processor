const dotenv = require("dotenv");
dotenv.config();
const { S3Client } = require("@aws-sdk/client-s3");

module.exports = {
  s3: new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
};