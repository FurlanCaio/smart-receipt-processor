const mongoose = require("mongoose")

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
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

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema)

module.exports = RefreshToken