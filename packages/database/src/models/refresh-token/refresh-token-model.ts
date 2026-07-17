import { Types } from 'mongoose'

export interface RefreshTokenDocument {
  userId: Types.ObjectId,
  tokenHash: string,
  expiresAt: Date,
  revokedAt: Date | null,
}