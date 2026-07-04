const crypto = require("crypto");

function encrypt(text, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(encryptedText, key, iv) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

require("dotenv").config();

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { s3 } = require("../../../../../shared/S3/client");

async function getImageUrl(s3Key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
  });

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 10,
  });

  return signedUrl;
}

module.exports = {
  encrypt,
  decrypt,
  getImageUrl,
};
