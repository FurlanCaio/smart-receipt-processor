import "dotenv/config";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../../../../../shared/S3/client.js";

interface UploadFileInput {
  fileName: string;
  fileBuffer: Buffer;
  contentType: string;
}

export async function uploadFile({ fileName, fileBuffer, contentType }: UploadFileInput) {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new Error("AWS_S3_BUCKET_NAME is not configured");

  const key = `profile/${Date.now()}-${fileName}`;

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  }));

  return { key };
}
