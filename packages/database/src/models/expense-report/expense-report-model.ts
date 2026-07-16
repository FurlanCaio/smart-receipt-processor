import { Types } from 'mongoose';

export interface ExpenseReportDocument {
  name: string;
  description: string | null;
  month: string | null;
  project: string | null;
  client: string | null;

  userId: Types.ObjectId;

  status: "draft" | "completed";

  receiptIds: Types.ObjectId[];

  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}