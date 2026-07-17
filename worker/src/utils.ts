import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../../shared/S3/client.js";

import crypto from "crypto";

export async function getImageUrl(bucketName: string, objectKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return url;
}

export function encrypt(text: string, key: string, iv: string): string {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function decrypt(encryptedText: string, key: string, iv: string): string {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
