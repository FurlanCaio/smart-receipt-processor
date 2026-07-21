import "dotenv/config";
import { User } from "../../../../../../packages/database/src/models/user/User.js";
import type { UserDocument } from "../../../../../../packages/database/src/models/user/user-model.js";
import { Receipt } from "../../../../../../packages/database/src/models/receipt/Receipt.js";
import { RefreshToken } from "../../../../../../packages/database/src/models/refresh-token/RefreshToken.js";
import { encrypt, getImageUrl } from "../utils.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { uploadFile } from "../providers/s3/upload-file.js";
import { AppError } from "../../../errors/AppError.js";

export interface UpdateProfileInput {
  name?: string;
  phoneNumber?: string;
  company?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ApiKeyInput {
  apiKey: string;
}

export interface UpdatePreferencesInput {
  openAiPreferenceModel: string;
  openAiPreferenceTemperature: number;
}

type UserProfileUpdate = Partial<Pick<UserDocument, "name" | "phoneNumber" | "company">>;

async function getProfileService(userId: string) {
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

async function updateProfileService(
  userId: string,
  { name, phoneNumber, company }: UpdateProfileInput,
) {
  if (!userId) {
    throw new AppError("User ID is required", 400, "VALIDATION_ERROR");
  }

  const updateData: UserProfileUpdate = {
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
  userId: string,
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string,
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

async function deleteAccountService(userId: string) {
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

async function insertApiKeyService({ userId, apiKey }: ApiKeyInput & { userId: string }) {
  if (!userId) {
    throw new AppError("UserId is required", 400, "VALIDATION_ERROR");
  }

  const iv = crypto.randomBytes(16);
  const encryptionKey = process.env.API_KEY_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new AppError("API key encryption is not configured", 500, "MISSING_ENCRYPTION_KEY");
  }

  const encryptedApiKey = encrypt(
    apiKey,
    encryptionKey,
    iv.toString("hex"),
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

async function uploadFileService(file: Express.Multer.File, userId: string) {
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

async function deleteAvatarService(userId: string) {
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
  userId: string,
  openAiPreferenceModel: string,
  openAiPreferenceTemperature: number,
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

async function getPreferencesService(userId: string) {
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

export default {
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
