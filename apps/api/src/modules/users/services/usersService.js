require("dotenv").config();
const User = require("../../../../../../packages/database/src/models/User.js");
const Receipt = require("../../../../../../packages/database/src/models/Receipt.js");
const RefreshToken = require("../../../../../../packages/database/src/models/RefreshToken.js");
const { encrypt, getImageUrl } = require("../utils.js");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { uploadFile } = require("../providers/s3/upload-file");
const { AppError } = require("../../../errors/AppError.js"); 

async function getProfileService(userId) {
  if (!userId) {
    throw new AppError("User ID is required", 400, "VALIDATION_ERROR");
  }

  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const profilePictureUrl = user.profilePictureUrl
    ? await getImageUrl(user.profilePictureUrl)
    : null;

  return {
    email: user.email ?? null,
    name: user.name ?? null,
    profilePictureUrl: profilePictureUrl ?? null,
    phoneNumber: user.phoneNumber ?? null,
    company: user.company ?? null,
  };
}

async function updateProfileService(userId, { name, phoneNumber, company }) {
  if (!userId) {
    throw new AppError("User ID is required", 400, "VALIDATION_ERROR");
  }

  const updateData = {
    ...(name !== undefined && { name: name === "" ? null : name }),
    ...(company !== undefined && { company: company === "" ? null : company }),
  };

  if (phoneNumber !== undefined) {
    updateData.phoneNumber = phoneNumber?.trim() === "" ? null : phoneNumber;
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      isDeleted: false,
    },
    updateData,
    {
      returnDocument: "after",
      runValidators: true,
      context: "query",
    },
  );

  if (!updatedUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return {
    name: updatedUser.name,
    phoneNumber: updatedUser.phoneNumber,
    company: updatedUser.company,
  };
}

async function changePasswordService(
  userId,
  currentPassword,
  newPassword,
  confirmNewPassword,
) {
  if (!userId) {
    throw new AppError("User ID is required", 400, "VALIDATION_ERROR");
  }

  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required", 400, "VALIDATION_ERROR");
  }

  if (newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters long", 400, "PASSWORD_TOO_SHORT");
  }

  if (newPassword !== confirmNewPassword) {
    throw new AppError("New passwords do not match", 400, "PASSWORD_MISMATCH");
  }

  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401, "INVALID_CREDENTIALS");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(
    userId,
    { password: hashedPassword },
    { runValidators: true, context: "query" },
  );

  return { message: "Password changed successfully" };
}

async function deleteAccountService(userId) {
  if (!userId) {
    throw new AppError("User ID is required", 400, "VALIDATION_ERROR");
  }

  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  await Receipt.updateMany({ userId }, { isDeleted: true });

  await RefreshToken.deleteMany({ userId });

  await User.findOneAndUpdate(
    { _id: userId },
    {
      isDeleted: true,
      email: `deleted_${user._id}_${user.email}`,
    },
    { runValidators: true, context: "query" },
  );

  return {
    message: "Account deleted successfully",
    userId,
  };
}

async function insertApiKeyService({ userId, apiKey }) {
  if (!userId) {
    throw new AppError("UserId is required", 400, "VALIDATION_ERROR");
  }

  const iv = crypto.randomBytes(16);
  const encryptedApiKey = encrypt(
    apiKey,
    process.env.API_KEY_ENCRYPTION_KEY,
    iv,
  );

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      isDeleted: false,
    },
    {
      openAiApiKey: encryptedApiKey,
      openAiApiKeyIv: iv.toString("hex"),
    },
    {
      returnDocument: "after",
      runValidators: true,
      context: "query",
    },
  );

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  return {
    message: "API key inserted successfully",
    userId: user._id,
    openAiApiKey: user.openAiApiKey,
  };
}

async function uploadFileService(file, userId) {
  const { originalname, buffer, mimetype } = file;

  const uploadResult = await uploadFile({
    fileName: originalname,
    fileBuffer: buffer,
    contentType: mimetype,
  });

  if (!uploadResult?.key) {
    throw new AppError("Upload failed", 500, "UPLOAD_FAILED");
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      isDeleted: false,
    },
    {
      profilePictureUrl: uploadResult.key,
    },
    {
      returnDocument: "after",
    },
  );

  if (!updatedUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  const profilePictureUrl = updatedUser.profilePictureUrl
    ? await getImageUrl(updatedUser.profilePictureUrl)
    : null;

  return { profilePictureUrl };
}

async function deleteAvatarService(userId) {
  if (!userId) {
    throw new AppError("User ID is required", 400, "VALIDATION_ERROR");
  }

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      isDeleted: false,
    },
    {
      $unset: { profilePictureUrl: 1 },
    },
  );

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
}

async function updatePreferencesService(
  userId,
  openAiPreferenceModel,
  openAiPreferenceTemperature,
) {
  if (!userId) {
    throw new AppError("User ID is required", 400, "VALIDATION_ERROR");
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      isDeleted: false,
    },
    {
      openAiPreferenceModel,
      openAiPreferenceTemperature,
    },
    {
      returnDocument: "after",
      runValidators: true,
      context: "query",
    },
  );

  if (!updatedUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return {
    message: "Preferences updated successfully",
    openAiPreferenceModel: updatedUser.openAiPreferenceModel,
    openAiPreferenceTemperature: updatedUser.openAiPreferenceTemperature,
  };
}

async function getPreferencesService(userId) {
  if (!userId) {
    throw new AppError("User ID is required", 400, "VALIDATION_ERROR");
  }

  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
  }).select("openAiPreferenceModel openAiPreferenceTemperature");

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return {
    openAiPreferenceModel: user.openAiPreferenceModel,
    openAiPreferenceTemperature: user.openAiPreferenceTemperature,
  };
}

module.exports = {
  insertApiKeyService,
  uploadFileService,
  getProfileService,
  deleteAvatarService,
  updateProfileService,
  changePasswordService,
  deleteAccountService,
  updatePreferencesService,
  getPreferencesService,
};