import "dotenv/config";
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from "../../../../../shared/S3/client.js";

export async function getImageUrl(s3Key: string) {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new Error("AWS_S3_BUCKET_NAME is not configured");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key
  })

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 10
  })

  return signedUrl
}

