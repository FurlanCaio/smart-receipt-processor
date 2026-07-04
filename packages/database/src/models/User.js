const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minLength: 5,
      maxLength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      validate: {
        validator: v => v && v.trim().length > 0,
        message: "Email cannot be empty"
      }
    },

    password: {
      type: String,
      required: true,
      minLength: 8,
      maxLength: 128
    },

    name: {
      type: String,
      trim: true,
      maxLength: 255
    },

    company: {
      type: String,
      trim: true,
      maxLength: 100
    },

    isDeleted: { 
      type: Boolean,
      default: false
     },

    phoneNumber: {
      type: String,
      trim: true,
      minLength: 4,
      maxLength: 15,
      set: value => value?.replace(/\D/g, ''),
      match: /^[0-9]{4,15}$/
    },

    profilePictureUrl: String,

    openAiApiKey: {
      type: String,
      maxLength: 500
    },

    openAiApiKeyIv: String,

    openAiPreferenceModel: {
      type: String,
      default: 'gpt-4o-mini'
    },

    openAiPreferenceTemperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },

    refreshTokenHash: String
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
