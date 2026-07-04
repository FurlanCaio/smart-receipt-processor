const dotenv = require("dotenv");
dotenv.config();
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../../../../../../../shared/S3/client");

module.exports = {
  uploadFile: async function ({
    fileName,
    fileBuffer,
    contentType,
  }) {
    const key = `profile/${Date.now()}-${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    return {
      key,
    };
  },
};