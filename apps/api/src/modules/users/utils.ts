import crypto from "crypto";
import "dotenv/config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../../../../../shared/S3/client.js";

export function encrypt(
  text: string,
  key: crypto.CipherKey,
  ivHex: string,
) {
  const iv = Uint8Array.from(Buffer.from(ivHex, "hex"));
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function decrypt(encryptedText: string, key: crypto.CipherKey, ivHex: string) {
  const iv = Uint8Array.from(Buffer.from(ivHex, "hex"));
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function getImageUrl(s3Key: string) {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new Error("AWS_S3_BUCKET_NAME is not configured");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  });

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 10,
  });

  return signedUrl;
}
