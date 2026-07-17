import {Schema, model} from 'mongoose'
import type { RefreshTokenDocument } from './refresh-token-model.js'

const refreshTokenSchema = new Schema<RefreshTokenDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    tokenHash: {
        type: String,
        required: true,
    },

    expiresAt: {
        type: Date,
        required: true,
    },

    revokedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

export const RefreshToken = model<RefreshTokenDocument>("RefreshToken", refreshTokenSchema)