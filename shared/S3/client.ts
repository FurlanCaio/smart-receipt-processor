import 'dotenv/config';
import { S3Client } from "@aws-sdk/client-s3";

if(!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS_REGION, AWS_ACCESS_KEY and AWS_SECRET_ACCESS_KEY must be defined in environment variables');
}

export default {
  s3: new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
};